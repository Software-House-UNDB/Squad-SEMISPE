import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '../../users/entities/user.entity';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

@Injectable()
export class UserAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params: { id?: string };
    }>();
    return (
      !!request.user &&
      (request.user.role === Role.ADMIN ||
        String(request.user.userId) === request.params.id)
    );
  }
}
