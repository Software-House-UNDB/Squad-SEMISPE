import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEcosystemActorDto } from './dto/create-ecosystem-actor.dto';
import { QueryEcosystemDto } from './dto/query-ecosystem.dto';
import { UpdateEcosystemActorDto } from './dto/update-ecosystem-actor.dto';
import {
  EcosystemActor,
  EcosystemCategory,
} from './entities/ecosystem-actor.entity';

export const ECOSYSTEM_CATEGORIES = [
  { value: EcosystemCategory.STARTUP, label: 'Startups' },
  { value: EcosystemCategory.COMPANY, label: 'Empresas' },
  { value: EcosystemCategory.UNIVERSITY, label: 'Universidades' },
  { value: EcosystemCategory.INSTITUTION, label: 'Instituições' },
  {
    value: EcosystemCategory.INNOVATION_ENVIRONMENT,
    label: 'Ambientes de inovação',
  },
  { value: EcosystemCategory.INVESTOR, label: 'Investidores' },
];

@Injectable()
export class EcosystemService {
  constructor(
    @InjectRepository(EcosystemActor)
    private readonly actors: Repository<EcosystemActor>,
  ) {}

  create(dto: CreateEcosystemActorDto) {
    this.validateCoordinates(dto);
    return this.actors.save(this.actors.create(dto));
  }

  async findAll(query: QueryEcosystemDto) {
    const builder = this.actors.createQueryBuilder('actor');
    if (query.category)
      builder.andWhere('actor.category = :category', {
        category: query.category,
      });
    if (query.search) {
      // Usa '=' como escape para tratar %, _ e o próprio escape como texto.
      const search = `%${query.search.replace(/[=%_]/g, '=$&')}%`;
      builder.andWhere(
        "(actor.name LIKE :search ESCAPE '=' OR actor.description LIKE :search ESCAPE '=' OR actor.city LIKE :search ESCAPE '=')",
        { search },
      );
    }
    if (query.hasLocation !== undefined) {
      builder.andWhere(
        query.hasLocation
          ? '(actor.latitude IS NOT NULL AND actor.longitude IS NOT NULL)'
          : '(actor.latitude IS NULL OR actor.longitude IS NULL)',
      );
    }
    const [items, total] = await builder
      .orderBy('actor.name', 'ASC')
      .addOrderBy('actor.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const actor = await this.actors.findOneBy({ id });
    if (!actor)
      throw new NotFoundException('Ator do ecossistema não encontrado.');
    return actor;
  }

  async update(id: number, dto: UpdateEcosystemActorDto) {
    // Valida o estado combinado sob lock para manter o par em PATCHs concorrentes.
    return this.actors.manager.transaction(async (manager) => {
      const actor = await manager.findOne(EcosystemActor, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!actor)
        throw new NotFoundException('Ator do ecossistema não encontrado.');
      Object.assign(
        actor,
        Object.fromEntries(
          Object.entries(dto).filter(([, value]) => value !== undefined),
        ),
      );
      this.validateCoordinates(actor);
      return manager.save(EcosystemActor, actor);
    });
  }

  async remove(id: number) {
    const result = await this.actors.delete(id);
    if (!result.affected)
      throw new NotFoundException('Ator do ecossistema não encontrado.');
  }

  async map(query: QueryEcosystemDto) {
    const { items, ...pagination } = await this.findAll({
      ...query,
      hasLocation: true,
    });
    return {
      type: 'FeatureCollection' as const,
      features: items.map(({ latitude, longitude, ...actor }) => ({
        type: 'Feature' as const,
        id: actor.id,
        geometry: {
          type: 'Point' as const,
          coordinates: [longitude!, latitude!],
        },
        properties: actor,
      })),
      ...pagination,
    };
  }

  private validateCoordinates(dto: {
    latitude?: number | null;
    longitude?: number | null;
  }) {
    if ((dto.latitude != null) !== (dto.longitude != null)) {
      throw new BadRequestException(
        'Latitude e longitude devem ser informadas ou removidas juntas.',
      );
    }
  }
}
