import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { Role, User } from '../users/entities/user.entity';
import { EcosystemModule } from './ecosystem.module';
import { EcosystemService } from './ecosystem.service';
import {
  EcosystemActor,
  EcosystemCategory,
} from './entities/ecosystem-actor.entity';

describe('EcosystemController (HTTP)', () => {
  let app: INestApplication<Server>;
  let admin: string;
  let user: string;
  const payload = {
    name: 'Startup local',
    category: EcosystemCategory.STARTUP,
    description: 'Soluções para a cidade.',
  };
  const actor = { id: 1, ...payload };
  const service = {
    create: jest.fn().mockResolvedValue(actor),
    findAll: jest
      .fn()
      .mockResolvedValue({ items: [actor], total: 1, page: 1, limit: 20 }),
    findOne: jest
      .fn()
      .mockImplementation((id: number) =>
        id === 1
          ? Promise.resolve(actor)
          : Promise.reject(new NotFoundException()),
      ),
    update: jest.fn().mockResolvedValue(actor),
    remove: jest.fn().mockResolvedValue(undefined),
    map: jest.fn().mockResolvedValue({
      type: 'FeatureCollection',
      features: [],
      total: 0,
      page: 1,
      limit: 20,
    }),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({ jwt: { secret: 'ecosystem-http-spec', expiresIn: '1h' } }),
          ],
        }),
        EcosystemModule,
      ],
    })
      .overrideProvider(getRepositoryToken(EcosystemActor))
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        findOneBy: jest.fn().mockImplementation(({ id }: { id: number }) =>
          Promise.resolve({
            tokenVersion: 0,
            id,
            role: id === 1 ? Role.ADMIN : Role.USER,
            email: 'test@example.com',
          }),
        ),
      })
      .overrideProvider(EcosystemService)
      .useValue(service)
      .compile();
    app = module.createNestApplication<INestApplication<Server>>();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    const jwt = module.get(JwtService);
    admin = await jwt.signAsync({ tokenVersion: 0, sub: 1 });
    user = await jwt.signAsync({ tokenVersion: 0, sub: 2 });
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app?.close();
  });
  const http = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${admin}` });

  it('permite consultar categorias, lista, detalhe e mapa publicamente', async () => {
    const response = await http().get('/api/ecosystem/categories').expect(200);
    expect(
      (response.body as { value: string }[]).map(({ value }) => value),
    ).toEqual(Object.values(EcosystemCategory));
    await http().get('/api/ecosystem/actors').expect(200);
    await http().get('/api/ecosystem/actors/1').expect(200);
    await http().get('/api/ecosystem/map').expect(200);
    await http().get('/api/ecosystem/actors/999').expect(404);
    await http().get('/api/ecosystem/actors/invalid').expect(400);
  });
  it('valida filtros, paginação e booleanos sem converter false em true', async () => {
    await http()
      .get(
        '/api/ecosystem/actors?category=startup&search=local&hasLocation=false&page=2&limit=5',
      )
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith({
      category: 'startup',
      search: 'local',
      hasLocation: false,
      page: 2,
      limit: 5,
    });
    for (const query of [
      'category=invalid',
      'page=0',
      'limit=101',
      'hasLocation=invalid',
      'hasLocation=1',
      'extra=x',
    ]) {
      await http().get(`/api/ecosystem/actors?${query}`).expect(400);
    }
  });
  it.each([
    { method: 'post' as const, path: '/api/ecosystem/actors' },
    { method: 'patch' as const, path: '/api/ecosystem/actors/1' },
    { method: 'delete' as const, path: '/api/ecosystem/actors/1' },
  ])('restringe $method ao administrador', async ({ method, path }) => {
    await http()[method](path).send(payload).expect(401);
    await http()
      [method](path)
      .set('Authorization', 'Bearer invalid')
      .send(payload)
      .expect(401);
    await http()
      [method](path)
      .set('Authorization', `Bearer ${user}`)
      .send(payload)
      .expect(403);
    await http()
      [method](path)
      .set(auth())
      .send(payload)
      .expect(method === 'post' ? 201 : method === 'delete' ? 204 : 200);
  });
  it('aceita todas as categorias e normaliza textos e UF', async () => {
    for (const category of Object.values(EcosystemCategory)) {
      await http()
        .post('/api/ecosystem/actors')
        .set(auth())
        .send({
          ...payload,
          name: ' Startup local ',
          category,
          city: ' São Luís ',
          state: ' ma ',
        })
        .expect(201);
      expect(service.create).toHaveBeenLastCalledWith({
        ...payload,
        category,
        city: 'São Luís',
        state: 'MA',
      });
    }
  });
  it.each([
    {},
    { ...payload, name: null },
    { ...payload, name: '  ' },
    { ...payload, name: 'x'.repeat(151) },
    { ...payload, category: 'government' },
    { ...payload, description: '' },
    { ...payload, description: 'x'.repeat(5001) },
    { ...payload, latitude: 91, longitude: 0 },
    { ...payload, latitude: 0, longitude: -181 },
    { ...payload, latitude: '0', longitude: '0' },
    { ...payload, latitude: true, longitude: 0 },
    { ...payload, websiteUrl: 'javascript:alert(1)' },
    { ...payload, websiteUrl: 'ftp://example.com' },
    { ...payload, websiteUrl: 'https://user:password@example.com' },
    { ...payload, logoUrl: 'invalid' },
    { ...payload, state: 'ZZ' },
    { ...payload, id: 1 },
  ])('rejeita dados inválidos: %j', async (body) => {
    await http()
      .post('/api/ecosystem/actors')
      .set(auth())
      .send(body)
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });
  it.each(['name', 'category', 'description'])(
    'PATCH rejeita null para %s obrigatório',
    async (field) => {
      await http()
        .patch('/api/ecosystem/actors/1')
        .set(auth())
        .send({ [field]: null })
        .expect(400);
    },
  );
  it('PATCH aceita campos omitidos, limpeza de opcionais e coordenadas zero', async () => {
    await http()
      .patch('/api/ecosystem/actors/1')
      .set(auth())
      .send({ description: 'Nova descrição' })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(1, {
      description: 'Nova descrição',
    });
    await http()
      .patch('/api/ecosystem/actors/1')
      .set(auth())
      .send({ latitude: null, longitude: null, logoUrl: null })
      .expect(200);
    await http()
      .post('/api/ecosystem/actors')
      .set(auth())
      .send({ ...payload, latitude: 0, longitude: 0 })
      .expect(201);
  });
});
