import { ConflictException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { Partner } from './entities/partner.entity';
import { PartnersService } from './partners.service';

const dto = {
  name: 'Parceiro',
  email: 'p@example.com',
  description: 'Descrição',
  shortDescription: 'Resumo',
};
function setup() {
  const repository = {
    findOneBy: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockReturnValue(dto),
    preload: jest.fn().mockResolvedValue({ id: 1, ...dto }),
    save: jest.fn().mockResolvedValue({ id: 1, ...dto }),
  };
  return {
    repository,
    service: new PartnersService(repository as unknown as Repository<Partner>),
  };
}

describe('PartnersService: conflitos', () => {
  it.each(['create', 'update'] as const)(
    'retorna 409 no %s quando o banco detecta duplicação após a consulta',
    async (method) => {
      const { service, repository } = setup();
      repository.save.mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }),
        ),
      );
      await expect(
        method === 'create' ? service.create(dto) : service.update(1, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );
  it.each(['create', 'update'] as const)(
    'preserva outros erros no %s',
    async (method) => {
      const { service, repository } = setup();
      const error = new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('connection'), { code: 'ECONNRESET' }),
      );
      repository.save.mockRejectedValue(error);
      await expect(
        method === 'create' ? service.create(dto) : service.update(1, dto),
      ).rejects.toBe(error);
    },
  );
  it('permite manter o próprio e-mail', async () => {
    const { service, repository } = setup();
    repository.findOneBy.mockResolvedValue({ id: 1, ...dto });
    await expect(service.update(1, dto)).resolves.toMatchObject({
      id: 1,
      ...dto,
    });
  });
  it('não grava e-mail já pertencente a outro parceiro', async () => {
    const { service, repository } = setup();
    repository.findOneBy.mockResolvedValue({ id: 2, ...dto });
    await expect(service.update(1, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
