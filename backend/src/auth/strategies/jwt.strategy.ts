import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role, User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  tokenVersion: number;
  sub: number;
  email: string;
  role: Role;
}

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (
      !payload ||
      !Number.isSafeInteger(payload.sub) ||
      payload.sub <= 0 ||
      !Number.isSafeInteger(payload.tokenVersion) ||
      payload.tokenVersion < 0
    ) {
      throw new UnauthorizedException('Token inválido');
    }
    let user: User;
    try {
      user = await this.usersService.findOne(payload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Conta não encontrada');
      }
      throw error;
    }
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
