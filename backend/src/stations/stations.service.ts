import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Station, StationParameter } from './interfaces/station.interface';

interface AurassureParameter {
  key?: string;
  name?: string;
  unit?: string | null;
  value?: string | number | null;
}

interface AurassureThing {
  id: number;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  last_data_received_time?: number | null;
  devices?: { online_status?: number }[];
  parameters?: AurassureParameter[];
}

interface AurassureThingsListResponse {
  status?: string;
  things?: AurassureThing[];
}

interface AurassureThingsDataResponse {
  status?: string;
  data?: {
    thing_id: number;
    time: number;
    parameter_values?: Record<string, { value?: number | null }>;
  }[];
}

interface AurassureConfig {
  baseUrl: string;
  clientId: string;
  applicationId: string;
  accessId: string;
  accessKey: string;
}

const REQUEST_TIMEOUT_MS = 10_000;
const ONE_HOUR_SECONDS = 3600;
// A listagem (things/list) traz o AQI sempre nulo; o valor so vem no
// things/data agregado. Janela de 7 dias para tambem trazer o ultimo valor de
// estacoes offline (o popup informa Offline e a data da ultima leitura).
const AQI_LOOKBACK_SECONDS = 7 * 24 * ONE_HOUR_SECONDS;

@Injectable()
export class StationsService {
  private readonly logger = new Logger(StationsService.name);

  constructor(private readonly configService: ConfigService) {}

  async findAll(): Promise<Station[]> {
    const config = this.getConfig();

    const list = await this.request<AurassureThingsListResponse>(
      config,
      'things/list',
    );

    const things = (list.things ?? []).filter(
      (thing) =>
        typeof thing.latitude === 'number' &&
        typeof thing.longitude === 'number',
    );

    const latestAqi = await this.fetchLatestAqi(
      config,
      things.map((thing) => thing.id),
    );

    return things.map((thing) => this.toStation(thing, latestAqi.get(thing.id)));
  }

  private getConfig(): AurassureConfig {
    const config = this.configService.getOrThrow<AurassureConfig>('aurassure');

    if (!config.accessId || !config.accessKey) {
      throw new ServiceUnavailableException(
        'Aurassure credentials are not configured (AURASSURE_ACCESS_ID / AURASSURE_ACCESS_KEY)',
      );
    }

    return config;
  }

  private async request<T>(
    config: AurassureConfig,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${config.baseUrl}/clients/${config.clientId}/applications/${config.applicationId}/${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Access-Id': config.accessId,
          'Access-Key': config.accessKey,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new BadGatewayException('Could not reach the Aurassure API');
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `Aurassure API responded with status ${response.status}`,
      );
    }

    return (await response.json()) as T;
  }

  // Ultimo AQI horario disponivel por estacao. Se a consulta falhar, o mapa
  // continua funcionando (pins cinza) em vez de derrubar a listagem.
  private async fetchLatestAqi(
    config: AurassureConfig,
    thingIds: number[],
  ): Promise<Map<number, number>> {
    const latest = new Map<number, { time: number; aqi: number }>();
    if (thingIds.length === 0) {
      return new Map();
    }

    const now = Math.floor(Date.now() / 1000);

    try {
      const response = await this.request<AurassureThingsDataResponse>(
        config,
        'things/data',
        {
          data_type: 'aggregate',
          aggregation_period: ONE_HOUR_SECONDS,
          parameters: ['aqi'],
          parameter_attributes: ['value'],
          things: thingIds,
          from_time: now - AQI_LOOKBACK_SECONDS,
          upto_time: now,
        },
      );

      for (const entry of response.data ?? []) {
        const aqi = entry.parameter_values?.aqi?.value;
        if (typeof aqi !== 'number') continue;

        const current = latest.get(entry.thing_id);
        if (!current || entry.time > current.time) {
          latest.set(entry.thing_id, { time: entry.time, aqi });
        }
      }
    } catch (error) {
      this.logger.warn(
        `Could not fetch AQI data: ${error instanceof Error ? error.message : error}`,
      );
    }

    return new Map([...latest].map(([id, { aqi }]) => [id, aqi]));
  }

  private toStation(thing: AurassureThing, aqi?: number): Station {
    const parameters = (thing.parameters ?? []).map(
      (parameter): StationParameter => ({
        key: parameter.key ?? '',
        name: parameter.name ?? parameter.key ?? '',
        unit: parameter.unit ?? null,
        value: this.toNumber(parameter.value),
      }),
    );

    return {
      id: thing.id,
      name: thing.name,
      latitude: thing.latitude as number,
      longitude: thing.longitude as number,
      online: (thing.devices ?? []).some((device) => device.online_status === 1),
      lastDataReceivedAt: thing.last_data_received_time
        ? new Date(thing.last_data_received_time * 1000).toISOString()
        : null,
      aqi:
        aqi ??
        parameters.find((parameter) => parameter.key.toLowerCase() === 'aqi')
          ?.value ??
        null,
      parameters: parameters.filter((parameter) => parameter.key !== 'aqi'),
    };
  }

  private toNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
