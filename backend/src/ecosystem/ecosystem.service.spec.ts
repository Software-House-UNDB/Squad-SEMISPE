import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { EcosystemService } from './ecosystem.service';
import {
  EcosystemActor,
  EcosystemCategory,
} from './entities/ecosystem-actor.entity';

describe('EcosystemService', () => {
  const payload = {
    name: 'Ator local',
    category: EcosystemCategory.STARTUP,
    description: 'Descrição pública',
  };
  const qb = {
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };
  const manager = {
    findOne: jest.fn(),
    save: jest.fn(),
    transaction: jest.fn(),
  };
  const repo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager,
  };
  let service: EcosystemService;
  let actor: EcosystemActor;
  beforeEach(() => {
    jest.resetAllMocks();
    actor = Object.assign(new EcosystemActor(), payload, {
      id: 1,
      latitude: -2.53,
      longitude: -44.3,
    });
    repo.create.mockImplementation((data: object) => data);
    repo.save.mockResolvedValue(actor);
    repo.findOneBy.mockResolvedValue(actor);
    repo.delete.mockResolvedValue({ affected: 1 });
    manager.findOne.mockResolvedValue(actor);
    manager.save.mockImplementation((_type: unknown, entity: EcosystemActor) =>
      Promise.resolve(entity),
    );
    manager.transaction.mockImplementation(
      (cb: (em: EntityManager) => unknown) =>
        cb(manager as unknown as EntityManager),
    );
    Object.values(qb).forEach((fn) => fn.mockReturnValue(qb));
    qb.getManyAndCount.mockResolvedValue([[actor], 1]);
    repo.createQueryBuilder.mockReturnValue(qb);
    service = new EcosystemService(
      repo as unknown as Repository<EcosystemActor>,
    );
  });
  it('cadastra ator sem localização e com coordenadas zero', async () => {
    await service.create(payload);
    await service.create({ ...payload, latitude: 0, longitude: 0 });
    expect(repo.save).toHaveBeenCalledTimes(2);
  });
  it.each([
    { latitude: 1 },
    { longitude: 1 },
    { latitude: null, longitude: 1 },
  ])('rejeita coordenadas incompletas %j', (coordinates) => {
    expect(() => service.create({ ...payload, ...coordinates })).toThrow(
      BadRequestException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('preserva campos omitidos, incluindo undefined explícito, ao atualizar coordenada existente', async () => {
    await expect(
      service.update(1, { latitude: 0, longitude: undefined, name: undefined }),
    ).resolves.toMatchObject({
      latitude: 0,
      longitude: -44.3,
      name: payload.name,
    });
    expect(manager.findOne).toHaveBeenCalledWith(EcosystemActor, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
  });
  it('limpa par completo e rejeita remover uma só coordenada', async () => {
    await expect(service.update(1, { latitude: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    actor = Object.assign(new EcosystemActor(), payload, {
      id: 1,
      latitude: -2.53,
      longitude: -44.3,
    });
    manager.findOne.mockResolvedValue(actor);
    await expect(
      service.update(1, { latitude: null, longitude: null }),
    ).resolves.toMatchObject({ latitude: null, longitude: null });
  });
  it('escapa curingas de busca e aplica categoria e filtro de localização', async () => {
    await service.findAll({
      page: 2,
      limit: 5,
      category: EcosystemCategory.STARTUP,
      search: '100%_=',
      hasLocation: false,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(expect.any(String), {
      search: '%100=%=_==%',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('actor.category = :category', {
      category: 'startup',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(actor.latitude IS NULL OR actor.longitude IS NULL)',
    );
    expect(qb.skip).toHaveBeenCalledWith(5);
    expect(qb.take).toHaveBeenCalledWith(5);
  });
  it('produz GeoJSON paginado na ordem longitude, latitude e força apenas localizados', async () => {
    const result = await service.map({
      page: 1,
      limit: 20,
      hasLocation: false,
    });
    expect(result).toMatchObject({
      type: 'FeatureCollection',
      total: 1,
      page: 1,
      limit: 20,
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-44.3, -2.53] },
          properties: { name: payload.name },
        },
      ],
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(actor.latitude IS NOT NULL AND actor.longitude IS NOT NULL)',
    );
  });
  it('retorna 404 em consulta, edição e exclusão inexistentes', async () => {
    repo.findOneBy.mockResolvedValue(null);
    manager.findOne.mockResolvedValue(null);
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(99, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
