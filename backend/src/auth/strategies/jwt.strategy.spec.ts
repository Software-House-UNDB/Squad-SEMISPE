import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Role } from '../../users/entities/user.entity';
import { JwtPayload, JwtStrategy } from './jwt.strategy';

describe('JwtStrategy: estado atual da conta', () => {
  const findOne = jest.fn();
  const strategy = new JwtStrategy(
    new ConfigService({ jwt: { secret: 'test-secret' } }),
    { findOne } as unknown as UsersService,
  );
  beforeEach(() => findOne.mockReset());
  const payload = { sub: 1, email: 'old@example.com', role: Role.ADMIN };
  it('usa email e papel atuais, mesmo com token antigo de admin', async () => {
    findOne.mockResolvedValue({
      id: 1,
      email: 'new@example.com',
      role: Role.USER,
    });
    await expect(strategy.validate(payload)).resolves.toEqual({
      userId: 1,
      email: 'new@example.com',
      role: Role.USER,
    });
  });
  it('retorna 401 para conta excluída', async () => {
    findOne.mockRejectedValue(new NotFoundException());
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
  it.each([undefined, null, 0, -1, '1', 1.5])(
    'rejeita sub inválido: %s',
    async (sub) => {
      await expect(
        strategy.validate({ ...payload, sub } as JwtPayload),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(findOne).not.toHaveBeenCalled();
    },
  );
  it('não transforma falha de banco em credenciais inválidas', async () => {
    const error = new Error('database unavailable');
    findOne.mockRejectedValue(error);
    await expect(strategy.validate(payload)).rejects.toBe(error);
  });
});
