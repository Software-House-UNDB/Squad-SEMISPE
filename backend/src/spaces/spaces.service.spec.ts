import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { ReservationStatus } from '../reservations/entities/reservation.entity';
import { Space } from './entities/space.entity';
import { SpacesService } from './spaces.service';

describe('SpacesService - exclusão de espaços com reservas', () => {
  const repository = { delete: jest.fn() };
  const service = new SpacesService(repository as unknown as Repository<Space>);
  beforeEach(() => jest.resetAllMocks());

  it('traduz a restrição da chave estrangeira em conflito', async () => {
    repository.delete.mockRejectedValue(
      new QueryFailedError(
        'DELETE',
        [],
        Object.assign(new Error(), { code: 'ER_ROW_IS_REFERENCED_2' }),
      ),
    );
    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
  });

  it('mantém 404 para espaço inexistente', async () => {
    repository.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propaga outros erros do banco', async () => {
    repository.delete.mockRejectedValue(new Error('offline'));
    await expect(service.remove(1)).rejects.toThrow('offline');
  });
});

describe('SpacesService: alteração de espaço reservado', () => {
  const qb = {
    where: jest.fn(),
    andWhere: jest.fn(),
    setLock: jest.fn(),
    getMany: jest.fn(),
  };
  const manager = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
    transaction: jest.fn(),
  };
  const repo = { manager };
  let service: SpacesService;
  beforeEach(() => {
    jest.resetAllMocks();
    manager.findOne.mockResolvedValue(
      Object.assign(new Space(), {
        id: 1,
        name: 'Sala',
        capacity: 30,
        equipment: ['Projetor'],
      }),
    );
    manager.save.mockImplementation((_type: unknown, entity: Space) =>
      Promise.resolve(entity),
    );
    manager.transaction.mockImplementation(
      (callback: (em: EntityManager) => unknown) =>
        callback(manager as unknown as EntityManager),
    );
    Object.values(qb).forEach((fn) => fn.mockReturnValue(qb));
    qb.getMany.mockResolvedValue([]);
    manager.createQueryBuilder.mockReturnValue(qb);
    service = new SpacesService(repo as unknown as Repository<Space>);
  });
  it('bloqueia redução incompatível com reserva aprovada', async () => {
    qb.getMany.mockResolvedValue([
      { participants: 20, equipment: ['Projetor'] },
    ]);
    await expect(service.update(1, { capacity: 5 })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(manager.save).not.toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalledWith('reservation.status = :status', {
      status: ReservationStatus.APPROVED,
    });
  });
  it('bloqueia remoção de equipamento necessário', async () => {
    qb.getMany.mockResolvedValue([
      { participants: 20, equipment: ['Projetor'] },
    ]);
    await expect(service.update(1, { equipment: [] })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('permite mudanças compatíveis e preserva campos omitidos', async () => {
    qb.getMany.mockResolvedValue([
      { participants: 20, equipment: ['Projetor'] },
    ]);
    await expect(
      service.update(1, {
        capacity: 40,
        equipment: ['Projetor', 'TV'],
        name: undefined,
      }),
    ).resolves.toMatchObject({
      name: 'Sala',
      capacity: 40,
      equipment: ['Projetor', 'TV'],
    });
    expect(manager.findOne).toHaveBeenCalledWith(Space, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
  });
  it('restringe a validação a reservas ainda não encerradas, no fuso de São Luís', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-12T12:30:00Z'));
    try {
      await service.update(1, { capacity: 40 });
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(String), {
        today: '2026-11-12',
        time: '09:30:00',
      });
    } finally {
      jest.useRealTimers();
    }
  });
  it('não consulta reservas ao editar somente descrição e retorna 404 para inexistente', async () => {
    await service.update(1, { description: 'Nova descrição' });
    expect(manager.createQueryBuilder).not.toHaveBeenCalled();
    manager.findOne.mockResolvedValue(null);
    await expect(service.update(99, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
