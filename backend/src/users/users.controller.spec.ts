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
      tokenVersion: 0,
      sub: 2,
      email: 'test@example.com',
      role: Role.USER,
    });
    adminToken = await jwt.signAsync({
      tokenVersion: 0,
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

  it('consulta o perfil autenticado sem id na URL e sem hash da senha', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(response.body).toMatchObject({ id: 2 });
    expect(response.body).not.toHaveProperty('password');
  });

  it('atualiza os contatos somente do titular identificado pelo JWT', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .send({ phone: '98999999999' })
      .expect(401);
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        phone: '98988887777',
        email: 'NOVO@example.com',
        institution: null,
        cnpj: null,
      })
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(service.update).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        phone: '98988887777',
        email: 'novo@example.com',
        institution: null,
        cnpj: null,
      }),
    );
  });

  it.each([
    { name: 'Outro Nome' },
    { cpf: '52998224725' },
    { role: 'admin' },
    { id: 1 },
    { password: 'other123456' },
    { email: null },
    { phone: '123' },
  ])('rejeita campos bloqueados ou inválidos no perfil: %j', async (body) => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .expect(400);
    expect(service.update).not.toHaveBeenCalled();
  });

  it.each([{ name: 'Outro Nome' }, { cpf: null }])(
    'impede contornar a identificação bloqueada pela rota antiga: %j',
    async (body) => {
      await request(app.getHttpServer())
        .patch('/api/users/2')
        .set('Authorization', `Bearer ${userToken}`)
        .send(body)
        .expect(400);
      expect(service.update).not.toHaveBeenCalled();
    },
  );

  it('bloqueia identificação do próprio admin e preserva a gestão administrativa de outras contas', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Outro Nome' })
      .expect(400);
    expect(service.update).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .patch('/api/users/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Nome corrigido' })
      .expect(200);
  });
});
