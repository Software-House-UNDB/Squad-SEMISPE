import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Hash bcrypt válido e pré-computado (custo 10, igual ao usado em
 * UsersService), sem senha real por trás. Usado apenas para que o caminho
 * "usuário não existe" execute o mesmo trabalho computacional de um
 * bcrypt.compare() real, evitando que a ausência de hashing vaze a
 * existência do e-mail por diferença de tempo.
 */
const DUMMY_PASSWORD_HASH =
  '$2b$10$eMDcc1UgI5NbemM4DEeFaeon7mezl8HQ3ot4L2wPLx0nDBLYg66zC';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      tokenVersion: user.tokenVersion,
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
