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
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { Space, SpaceState } from './entities/space.entity';
import { SpacesModule } from './spaces.module';
import { SpacesService } from './spaces.service';

interface MutationRequest {
  method: 'post' | 'patch' | 'delete';
  path: string;
  payload: Record<string, unknown>;
  handler: 'create' | 'update' | 'remove';
}

describe('SpacesController (HTTP, validação e permissões)', () => {
  let app: INestApplication<Server>;
  let adminToken: string;
  let userToken: string;
  let expiredToken: string;

  const payload = {
    name: 'Miniauditório',
    capacity: 60,
    photoUrls: ['https://example.com/espaco.jpg'],
    equipment: ['Projetor', 'Microfone'],
  };
  const space = Object.assign(new Space(), payload, {
    id: 1,
    createdAt: new Date('2026-01-01T12:00:00.000Z'),
    updatedAt: new Date('2026-01-01T12:00:00.000Z'),
  });
  const service = {
    create: jest
      .fn<Promise<Space>, [CreateSpaceDto]>()
      .mockResolvedValue(space),
    findAll: jest.fn<Promise<Space[]>, []>().mockResolvedValue([space]),
    findOne: jest.fn<Promise<Space>, [number]>().mockImplementation((id) => {
      if (id !== space.id) {
        return Promise.reject(
          new NotFoundException(`Espaço com id ${id} não encontrado.`),
        );
      }
      return Promise.resolve(space);
    }),
    update: jest
      .fn<Promise<Space>, [number, UpdateSpaceDto]>()
      .mockResolvedValue(space),
    remove: jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined),
  };
  const mutations: MutationRequest[] = [
    { method: 'post', path: '/api/spaces', payload, handler: 'create' },
    {
      method: 'patch',
      path: '/api/spaces/1',
      payload: { capacity: 80 },
      handler: 'update',
    },
    {
      method: 'delete',
      path: '/api/spaces/1',
      payload: {},
      handler: 'remove',
    },
  ];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              jwt: {
                secret: 'spaces-controller-spec-secret',
                expiresIn: '1h',
              },
            }),
          ],
        }),
        SpacesModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Space))
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        findOneBy: jest.fn().mockImplementation(({ id }: { id: number }) =>
          Promise.resolve({
            tokenVersion: 0,
            id,
            email: id === 1 ? 'admin@example.com' : 'user@example.com',
            role: id === 1 ? Role.ADMIN : Role.USER,
          }),
        ),
      })
      .overrideProvider(SpacesService)
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
      sub: 1,
      email: 'admin@example.com',
      role: Role.ADMIN,
    });
    userToken = await jwt.signAsync({
      tokenVersion: 0,
      sub: 2,
      email: 'user@example.com',
      role: Role.USER,
    });
    expiredToken = await jwt.signAsync(
      { tokenVersion: 0, sub: 1, email: 'admin@example.com', role: Role.ADMIN },
      { expiresIn: -1 },
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  function mutate(mutation: MutationRequest, token?: string): request.Test {
    const call = request(app.getHttpServer())[mutation.method](mutation.path);
    const authenticated = token
      ? call.set('Authorization', `Bearer ${token}`)
      : call;
    return authenticated.send(mutation.payload);
  }

  it('permite listar espaços sem autenticação', async () => {
    await request(app.getHttpServer())
      .get('/api/spaces')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual([
          {
            ...payload,
            id: 1,
            description: null,
            state: SpaceState.ACTIVE,
            createdAt: '2026-01-01T12:00:00.000Z',
            updatedAt: '2026-01-01T12:00:00.000Z',
          },
        ]);
      });
  });

  it('permite buscar por id sem autenticação', async () => {
    await request(app.getHttpServer()).get('/api/spaces/1').expect(200);
  });

  it('retorna 400 para um id não numérico', async () => {
    await request(app.getHttpServer()).get('/api/spaces/abc').expect(400);
    expect(service.findOne).not.toHaveBeenCalled();
  });

  it('retorna 404 para um espaço inexistente', async () => {
    await request(app.getHttpServer())
      .get('/api/spaces/999')
      .expect(404)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'Espaço com id 999 não encontrado.',
        });
      });
  });

  it.each(mutations)('bloqueia $method sem token', async (mutation) => {
    await mutate(mutation).expect(401);
    expect(service[mutation.handler]).not.toHaveBeenCalled();
  });

  it.each(mutations)(
    'bloqueia $method com token inválido',
    async (mutation) => {
      await mutate(mutation, 'token-invalido').expect(401);
      expect(service[mutation.handler]).not.toHaveBeenCalled();
    },
  );

  it.each(mutations)(
    'bloqueia $method com token expirado',
    async (mutation) => {
      await mutate(mutation, expiredToken).expect(401);
      expect(service[mutation.handler]).not.toHaveBeenCalled();
    },
  );

  it.each(mutations)(
    'bloqueia $method para usuário comum',
    async (mutation) => {
      await mutate(mutation, userToken).expect(403);
      expect(service[mutation.handler]).not.toHaveBeenCalled();
    },
  );

  it.each(mutations)('permite $method para admin', async (mutation) => {
    await mutate(mutation, adminToken).expect(
      mutation.method === 'post' ? 201 : 200,
    );
  });

  it('rejeita cadastro inválido com as mensagens em português', async () => {
    await request(app.getHttpServer())
      .post('/api/spaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '   ', capacity: 0 })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: [
            'O nome é obrigatório.',
            'A capacidade deve ser maior que zero.',
          ],
        });
      });
    expect(service.create).not.toHaveBeenCalled();
  });

  it('rejeita campos desconhecidos na edição', async () => {
    await request(app.getHttpServer())
      .patch('/api/spaces/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
      .expect(400);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('aceita listas vazias na edição por admin', async () => {
    await request(app.getHttpServer())
      .patch('/api/spaces/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ equipment: [], photoUrls: [] })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(1, {
      equipment: [],
      photoUrls: [],
    });
  });
});
