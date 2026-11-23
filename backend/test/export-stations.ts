import 'reflect-metadata';
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { StationsService } from '../src/stations/stations.service';

/**
 * Gera o stations.json (mesmos dados do GET /api/stations) fora do servidor.
 * Usado pelo workflow update-stations, que publica o arquivo no GitHub Pages
 * quando não há backend público. Uso: ts-node test/export-stations.ts <saida>
 */
async function main(): Promise<void> {
  const output = process.argv[2];
  if (!output) {
    throw new Error('Informe o arquivo de saída. Ex.: stations.json');
  }

  const config = { getOrThrow: () => configuration().aurassure };
  const service = new StationsService(config as unknown as ConfigService);
  const stations = await service.findAll();

  // Sem estações ou sem nenhum AQI, algo falhou na origem: melhor falhar do que
  // sobrescrever os últimos dados bons no site.
  if (stations.length === 0 || stations.every((s) => s.aqi === null)) {
    throw new Error(
      `Resposta suspeita da Aurassure: ${stations.length} estações, nenhuma com AQI.`,
    );
  }

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(
    output,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), stations },
      null,
      2,
    ),
  );
  console.log(`${stations.length} estações gravadas em ${output}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
