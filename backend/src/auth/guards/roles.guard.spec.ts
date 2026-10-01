import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/entities/user.entity';
import { AuthenticatedUser } from '../strategies/jwt.strategy';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  const buildContext = (user?: AuthenticatedUser): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('libera a rota quando não há @Roles() definido', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const allowed = guard.canActivate(buildContext());

    expect(allowed).toBe(true);
  });

  it('bloqueia USER em rota marcada como ADMIN-only', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const allowed = guard.canActivate(
      buildContext({ userId: 1, email: 'user@example.com', role: Role.USER }),
    );

    expect(allowed).toBe(false);
  });

  it('permite ADMIN em rota marcada como ADMIN-only', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const allowed = guard.canActivate(
      buildContext({ userId: 2, email: 'admin@example.com', role: Role.ADMIN }),
    );

    expect(allowed).toBe(true);
  });

  it('bloqueia quando não há usuário autenticado no request', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const allowed = guard.canActivate(buildContext(undefined));

    expect(allowed).toBe(false);
  });
});
