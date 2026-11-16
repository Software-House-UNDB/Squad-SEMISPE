import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService: integridade e sessões', () => {
  const manager = {
    findOne: jest.fn(),
    save: jest.fn(),
    transaction: jest.fn(),
  };
  const repo = { delete: jest.fn(), manager };
  let user: User;
  let service: UsersService;
  beforeEach(() => {
    jest.resetAllMocks();
    user = Object.assign(new User(), {
      id: 1,
      name: 'Teste',
      password: 'hash-anterior',
      tokenVersion: 2,
    });
    manager.findOne.mockResolvedValue(user);
    manager.save.mockImplementation((_type: unknown, entity: User) =>
      Promise.resolve(entity),
    );
    manager.transaction.mockImplementation(
      (callback: (em: EntityManager) => unknown) =>
        callback(manager as unknown as EntityManager),
    );
    service = new UsersService(repo as unknown as Repository<User>);
  });
  it('troca senha sob lock e incrementa a versão da sessão', async () => {
    const result = await service.update(1, { password: 'NovaSenha123!' });
    expect(result.tokenVersion).toBe(3);
    expect(await bcrypt.compare('NovaSenha123!', result.password)).toBe(true);
    expect(manager.findOne).toHaveBeenCalledWith(User, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
  });
  it('edições de perfil preservam senha e versão da sessão', async () => {
    await expect(
      service.update(1, { name: 'Nome atualizado', email: undefined }),
    ).resolves.toMatchObject({
      name: 'Nome atualizado',
      password: 'hash-anterior',
      tokenVersion: 2,
    });
  });
  it('retorna 404 ao editar usuário inexistente', async () => {
    manager.findOne.mockResolvedValue(null);
    await expect(service.update(99, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('traduz FK de ideias em conflito, sem apagar o histórico', async () => {
    repo.delete.mockRejectedValue(
      new QueryFailedError(
        'DELETE',
        [],
        Object.assign(new Error(), { code: 'ER_ROW_IS_REFERENCED_2' }),
      ),
    );
    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
  });
  it('preserva outros erros e 404 de exclusão', async () => {
    repo.delete
      .mockRejectedValueOnce(new Error('DB offline'))
      .mockResolvedValueOnce({ affected: 0 });
    await expect(service.remove(1)).rejects.toThrow('DB offline');
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
