import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
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
