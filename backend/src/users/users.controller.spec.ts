import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { AuthModule } from '../auth/auth.module';
import { Role, User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersController: autorização HTTP', () => {
  let app: INestApplication<Server>;
  let userToken: string, adminToken: string;
  const service = {
    findOne: jest.fn().mockImplementation((id: number) =>
      Promise.resolve(
        Object.assign(new User(), {
          id,
          email: 'test@example.com',
          role: id === 1 ? Role.ADMIN : Role.USER,
          password: 'never-expose',
        }),
      ),
    ),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 3, role: Role.USER }),
    update: jest.fn().mockResolvedValue({ id: 2 }),
    remove: jest.fn().mockResolvedValue(undefined),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({ jwt: { secret: 'users-test-secret', expiresIn: '1h' } }),
          ],
        }),
        AuthModule,
      ],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(UsersService)
      .useValue(service)
      .compile();
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
    const jwt = module.get(JwtService);
    userToken = await jwt.signAsync({
      sub: 2,
      email: 'test@example.com',
      role: Role.USER,
    });
    adminToken = await jwt.signAsync({
      sub: 1,
      email: 'test@example.com',
      role: Role.ADMIN,
    });
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  beforeEach(() => jest.clearAllMocks());
  it('mantém cadastro público e impede definir role pelo cadastro', async () => {
    const body = {
      name: 'Teste',
      email: 'test@example.com',
      password: 'password123',
    };
    await request(app.getHttpServer())
      .post('/api/users')
      .send(body)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/users')
      .send({ ...body, role: 'admin' })
      .expect(400);
  });
  it('restringe listagem a admin', async () => {
    await request(app.getHttpServer()).get('/api/users').expect(401);
    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
  it.each(['get', 'patch', 'delete'] as const)(
    'protege %s por proprietário ou admin',
    async (method) => {
      const payload = method === 'patch' ? { password: 'changed123' } : {};
      await request(app.getHttpServer())
        [method]('/api/users/2')
        .send(payload)
        .expect(401);
      await request(app.getHttpServer())
        [method]('/api/users/3')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload)
        .expect(403);
      if (method === 'patch') expect(service.update).not.toHaveBeenCalled();
      if (method === 'delete') expect(service.remove).not.toHaveBeenCalled();
      await request(app.getHttpServer())
        [method]('/api/users/2')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload)
        .expect(200);
      await request(app.getHttpServer())
        [method]('/api/users/3')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(200);
    },
  );
  it('não expõe o hash da senha', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users/2')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(response.body).not.toHaveProperty('password');
  });
  it('impede que o usuário altere o próprio papel', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/2')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'admin' })
      .expect(400);
    expect(service.update).not.toHaveBeenCalled();
  });
});
