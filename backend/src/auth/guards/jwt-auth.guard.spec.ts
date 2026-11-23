import {
  Controller,
  Get,
  INestApplication,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import type { Server } from 'node:http';
import { Role } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { NotFoundException } from '@nestjs/common';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

const TEST_SECRET = 'jwt-auth-guard-spec-secret';
const OTHER_SECRET = 'a-completely-different-secret';

/**
 * Controller de teste, usado somente dentro desta suíte para exercitar o
 * JwtAuthGuard via HTTP real. Não é registrado em nenhum módulo da aplicação.
 */
@Controller('__test-protected')
class ProtectedTestController {
  @Get()
  @UseGuards(JwtAuthGuard)
  get(@Req() req: { user?: unknown }) {
    return { user: req.user };
  }
}

describe('JwtAuthGuard (integração via HTTP)', () => {
  let app: INestApplication<Server>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [ProtectedTestController],
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockImplementation((id: number) => {
              if (id === 7)
                return Promise.resolve({
                  tokenVersion: 0,
                  id: 7,
                  email: 'valid@example.com',
                  role: Role.ADMIN,
                });
              throw new NotFoundException();
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              key === 'jwt.secret' ? TEST_SECRET : '1h',
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication<INestApplication<Server>>();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejeita com 401 quando não há header Authorization', async () => {
    await request(app.getHttpServer()).get('/__test-protected').expect(401);
  });

  it('rejeita com 401 quando o Authorization não usa o esquema Bearer', async () => {
    const token = await jwtService.signAsync({
      tokenVersion: 0,
      sub: 1,
      email: 'a@a.com',
      role: Role.USER,
    });

    await request(app.getHttpServer())
      .get('/__test-protected')
      .set('Authorization', token)
      .expect(401);
  });

  it('rejeita com 401 quando o Bearer está vazio', async () => {
    await request(app.getHttpServer())
      .get('/__test-protected')
      .set('Authorization', 'Bearer ')
      .expect(401);
  });

  it('rejeita com 401 quando o token tem assinatura inválida', async () => {
    const tokenSignedWithOtherSecret = new JwtService({
      secret: OTHER_SECRET,
    }).sign({ tokenVersion: 0, sub: 1, email: 'a@a.com', role: Role.USER });

    await request(app.getHttpServer())
      .get('/__test-protected')
      .set('Authorization', `Bearer ${tokenSignedWithOtherSecret}`)
      .expect(401);
  });

  it('rejeita com 401 quando o token está expirado', async () => {
    const expiredToken = await jwtService.signAsync(
      { tokenVersion: 0, sub: 1, email: 'a@a.com', role: Role.USER },
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .get('/__test-protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('autentica com 200 e popula req.user quando o token é válido', async () => {
    const token = await jwtService.signAsync({
      tokenVersion: 0,
      sub: 7,
      email: 'valid@example.com',
      role: Role.ADMIN,
    });

    const response = await request(app.getHttpServer())
      .get('/__test-protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as { user: unknown };
    expect(body.user).toEqual({
      userId: 7,
      email: 'valid@example.com',
      role: Role.ADMIN,
    });
  });
});
