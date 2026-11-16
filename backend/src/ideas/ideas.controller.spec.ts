import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { Role, User } from '../users/entities/user.entity';
import { Idea, IdeaCategory, IdeaStatus } from './entities/idea.entity';
import { IdeasModule } from './ideas.module';
import { IdeasService } from './ideas.service';

describe('IdeasController (HTTP, validação e permissões)', () => {
  let app: INestApplication<Server>;
  let adminToken: string;
  let userToken: string;

  const ADMIN_ID = 1;
  const USER_ID = 2;
  const payload = {
    title: 'Ônibus com wi-fi',
    category: IdeaCategory.MOBILITY,
    problem: 'Sem internet no trajeto.',
    solution: 'Roteadores nos ônibus.',
    expectedBenefits: 'Inclusão digital.',
    targetAudience: 'Passageiros',
    applicationArea: 'Transporte',
  };
  const idea = Object.assign(new Idea(), payload, {
    id: 10,
    authorId: USER_ID,
    status: IdeaStatus.SUBMITTED,
  });
  const service = {
    create: jest.fn().mockResolvedValue(idea),
    findAll: jest.fn().mockResolvedValue([idea]),
    findMine: jest.fn().mockResolvedValue([idea]),
    findOne: jest.fn().mockResolvedValue(idea),
    update: jest.fn().mockResolvedValue(idea),
    updateStatus: jest.fn().mockResolvedValue(idea),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              jwt: { secret: 'ideas-controller-spec', expiresIn: '1h' },
            }),
          ],
        }),
        IdeasModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Idea))
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        findOneBy: jest.fn().mockImplementation(({ id }: { id: number }) =>
          Promise.resolve({
            tokenVersion: 0,
            id,
            email: `user${id}@example.com`,
            role: id === ADMIN_ID ? Role.ADMIN : Role.USER,
          }),
        ),
      })
      .overrideProvider(IdeasService)
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
    adminToken = await jwt.signAsync({
      tokenVersion: 0,
      sub: ADMIN_ID,
      email: 'user1@example.com',
      role: Role.ADMIN,
    });
    userToken = await jwt.signAsync({
      tokenVersion: 0,
      sub: USER_ID,
      email: 'user2@example.com',
      role: Role.USER,
    });
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(async () => {
    if (app) await app.close();
  });

  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  it.each([
    ['post', '/api/ideas'],
    ['get', '/api/ideas/mine'],
    ['get', '/api/ideas'],
    ['get', '/api/ideas/10'],
    ['patch', '/api/ideas/10'],
    ['patch', '/api/ideas/10/status'],
    ['delete', '/api/ideas/10'],
  ] as const)('exige login em %s %s', async (method, path) => {
    await http()[method](path).send({}).expect(401);
  });

  it('envia a ideia com o autor vindo do token', async () => {
    await http()
      .post('/api/ideas')
      .set(auth(userToken))
      .send(payload)
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(payload, USER_ID);
  });

  it('rejeita authorId e status enviados pelo cliente', async () => {
    await http()
      .post('/api/ideas')
      .set(auth(userToken))
      .send({ ...payload, authorId: ADMIN_ID, status: IdeaStatus.APPROVED })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('lista as ideias do próprio usuário em /mine', async () => {
    await http().get('/api/ideas/mine').set(auth(userToken)).expect(200);
    expect(service.findMine).toHaveBeenCalledWith(USER_ID);
    expect(service.findOne).not.toHaveBeenCalled();
  });

  it('bloqueia a listagem geral para usuário comum', async () => {
    await http().get('/api/ideas').set(auth(userToken)).expect(403);
    expect(service.findAll).not.toHaveBeenCalled();
  });

  it('permite ao admin listar com filtros', async () => {
    await http()
      .get('/api/ideas?category=mobility&status=submitted')
      .set(auth(adminToken))
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith({
      category: IdeaCategory.MOBILITY,
      status: IdeaStatus.SUBMITTED,
    });
  });

  it('rejeita filtro inválido com mensagem em português', async () => {
    await http()
      .get('/api/ideas?category=esportes')
      .set(auth(adminToken))
      .expect(400)
      .expect((response) => {
        expect((response.body as { message: string }).message).toMatch(
          /^O filtro category deve ser um dos seguintes/,
        );
      });
  });

  it('repassa o usuário logado na busca por id', async () => {
    await http().get('/api/ideas/10').set(auth(userToken)).expect(200);
    expect(service.findOne).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ userId: USER_ID, role: Role.USER }),
    );
  });

  it('retorna 400 para id não numérico', async () => {
    await http().get('/api/ideas/abc').set(auth(userToken)).expect(400);
  });

  it('permite ao autor editar o conteúdo', async () => {
    await http()
      .patch('/api/ideas/10')
      .set(auth(userToken))
      .send({ title: 'Novo título' })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(
      10,
      { title: 'Novo título' },
      expect.objectContaining({ userId: USER_ID }),
    );
  });

  it('não deixa mudar o status pela edição de conteúdo', async () => {
    await http()
      .patch('/api/ideas/10')
      .set(auth(userToken))
      .send({ status: IdeaStatus.APPROVED })
      .expect(400);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('bloqueia a troca de status para usuário comum', async () => {
    await http()
      .patch('/api/ideas/10/status')
      .set(auth(userToken))
      .send({ status: IdeaStatus.APPROVED })
      .expect(403);
    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('permite ao admin trocar o status', async () => {
    await http()
      .patch('/api/ideas/10/status')
      .set(auth(adminToken))
      .send({ status: IdeaStatus.APPROVED })
      .expect(200);
    expect(service.updateStatus).toHaveBeenCalledWith(10, IdeaStatus.APPROVED);
  });

  it('repassa o usuário logado na exclusão', async () => {
    await http().delete('/api/ideas/10').set(auth(userToken)).expect(200);
    expect(service.remove).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ userId: USER_ID }),
    );
  });
});
