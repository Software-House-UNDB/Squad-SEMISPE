import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
describe('AuthController: limite de login', () => {
  let app: INestApplication<Server>;
  const login = jest
    .fn()
    .mockRejectedValue(new UnauthorizedException('Credenciais inválidas'));
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: { login } }],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  it('bloqueia a sexta requisição e informa Retry-After, sem confiar em X-Forwarded-For', async () => {
    for (let i = 0; i < 5; i++)
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'incorrect' })
        .expect(401);
    const blocked = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({ email: 'different@example.com', password: 'incorrect' })
      .expect(429);
    expect(login).toHaveBeenCalledTimes(5);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });
});
