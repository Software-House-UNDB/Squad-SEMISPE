import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role, User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtPayload } from './strategies/jwt.strategy';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: jest.Mock };
  let jwtService: { signAsync: jest.Mock<Promise<string>, [JwtPayload]> };

  const plainPassword = 'correct-password';

  const buildUser = async (): Promise<User> => ({
    id: 1,
    name: 'Jane Doe',
    institution: null,
    cpf: '12345678900',
    cnpj: null,
    email: 'jane@example.com',
    phone: null,
    password: await bcrypt.hash(plainPassword, 10),
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn() };
    jwtService = {
      signAsync: jest
        .fn<Promise<string>, [JwtPayload]>()
        .mockResolvedValue('signed.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  it('autentica com sucesso e retorna accessToken + dados públicos do usuário', async () => {
    const user = await buildUser();
    usersService.findByEmail.mockResolvedValue(user);

    const result = await authService.login({
      email: user.email,
      password: plainPassword,
    });

    expect(result).toEqual({
      accessToken: 'signed.jwt.token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    expect(result.user).not.toHaveProperty('password');
  });

  it('gera o payload do JWT apenas com sub, email e role', async () => {
    const user = await buildUser();
    usersService.findByEmail.mockResolvedValue(user);

    await authService.login({ email: user.email, password: plainPassword });

    expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
    const payload = jwtService.signAsync.mock.calls[0][0];

    expect(payload).toEqual({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    expect(payload).not.toHaveProperty('password');
    expect(payload).not.toHaveProperty('cpf');
    expect(payload).not.toHaveProperty('cnpj');
    expect(payload).not.toHaveProperty('phone');
    expect(payload).not.toHaveProperty('institution');
  });

  it('rejeita com 401 "Credenciais inválidas" quando a senha está incorreta', async () => {
    const user = await buildUser();
    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      authService.login({ email: user.email, password: 'wrong-password' }),
    ).rejects.toMatchObject(new UnauthorizedException('Credenciais inválidas'));
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejeita com exatamente o mesmo 401 quando o e-mail não existe', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'nao-existe@example.com',
        password: 'qualquer-coisa',
      }),
    ).rejects.toMatchObject(new UnauthorizedException('Credenciais inválidas'));
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('executa uma comparação bcrypt real mesmo quando o usuário não existe', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    const compareSpy = jest.spyOn(bcrypt, 'compare');

    await expect(
      authService.login({ email: 'nao-existe@example.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(compareSpy).toHaveBeenCalledTimes(1);
    const [, hashArg] = compareSpy.mock.calls[0];
    expect(typeof hashArg).toBe('string');
    expect(hashArg.length).toBeGreaterThan(0);
    expect(hashArg).toMatch(/^\$2[aby]\$\d{2}\$/);
  });
});
