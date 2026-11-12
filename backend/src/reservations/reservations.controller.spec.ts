import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { AuthModule } from '../auth/auth.module';
import { Role, User } from '../users/entities/user.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

describe('ReservationsController (HTTP)', () => {
  let app: INestApplication<Server>;
  let admin: string;
  let user: string;
  const storage = new ThrottlerStorageService();
  const pdf = Buffer.from('%PDF-1.4\nexample');
  const payload = {
    requester: {
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '98999999999',
      type: 'pessoa-fisica',
      document: '52998224725',
      institution: null,
    },
    spaceId: 1,
    date: '2099-06-10',
    startTime: '09:00',
    endTime: '10:00',
    participants: 10,
    eventType: 'Reunião',
    equipment: ['Projetor'],
    needsItSupport: false,
    subject: 'Planejamento',
    consent: true,
  };
  const service = {
    create: jest.fn().mockResolvedValue({ id: 1, status: 'pending' }),
    schedule: jest
      .fn()
      .mockResolvedValue({ spaceId: 1, date: '2099-06-10', occupied: [] }),
    findAll: jest
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
    findOne: jest.fn().mockResolvedValue({ id: 1, attachments: [] }),
    review: jest.fn().mockResolvedValue({ id: 1, status: 'approved' }),
    download: jest.fn().mockResolvedValue({
      content: pdf,
      size: pdf.length,
      mimeType: 'application/pdf',
      originalName: 'ofício.pdf',
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              jwt: { secret: 'reservations-spec-secret', expiresIn: '1h' },
            }),
          ],
        }),
        AuthModule,
      ],
      controllers: [ReservationsController],
      providers: [{ provide: ReservationsService, useValue: service }],
    })
      .overrideProvider(ThrottlerStorage)
      .useValue(storage)
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        findOneBy: jest.fn().mockImplementation(({ id }: { id: number }) =>
          Promise.resolve({
            tokenVersion: 0,
            id,
            email: 'test@example.com',
            role: id === 1 ? Role.ADMIN : Role.USER,
          }),
        ),
      })
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
    admin = await jwt.signAsync({ tokenVersion: 0, sub: 1 });
    user = await jwt.signAsync({ tokenVersion: 0, sub: 2 });
  });
  beforeEach(() => {
    jest.clearAllMocks();
    storage.onApplicationShutdown();
  });
  afterAll(async () => {
    await app?.close();
  });

  function submit(data: unknown = payload) {
    return request(app.getHttpServer())
      .post('/api/reservations')
      .field('dados', typeof data === 'string' ? data : JSON.stringify(data))
      .attach('oficio', pdf, 'oficio.pdf');
  }
  it('bloqueia a sexta tentativa antes de processar upload e não confia em IP enviado pelo cliente', async () => {
    for (let i = 0; i < 5; i++) await submit().expect(201);
    await request(app.getHttpServer())
      .post('/api/reservations')
      .set('X-Forwarded-For', '203.0.113.55')
      .send({})
      .expect(429);
    expect(service.create).toHaveBeenCalledTimes(5);
  });

  it('aceita multipart público e transforma o JSON com o ValidationPipe global habilitado', async () => {
    await submit().expect(201).expect({ id: 1, status: 'pending' });
    expect(service.create).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        oficio: [expect.objectContaining({ buffer: pdf })],
      }),
    );
  });

  it('aceita os quatro anexos previstos', async () => {
    await submit()
      .attach('projeto', pdf, 'projeto.pdf')
      .attach('apresentacao', pdf, 'apresentacao.pdf')
      .attach('pauta', pdf, 'pauta.pdf')
      .expect(201);
  });

  it.each([
    '{invalid',
    'null',
    '[]',
    { ...payload, consent: false },
    { ...payload, participants: 0 },
    { ...payload, date: '2099-02-30' },
    { ...payload, startTime: '25:00' },
    { ...payload, status: 'approved' },
    { ...payload, requester: { ...payload.requester, role: 'admin' } },
    { ...payload, requester: null },
    {
      ...payload,
      requester: {
        ...payload.requester,
        type: 'instituicao',
        institution: null,
      },
    },
  ])('rejeita dados inválidos ou campos extras: %j', async (data) => {
    await submit(data).expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('rejeita dados ausentes', async () => {
    await request(app.getHttpServer())
      .post('/api/reservations')
      .attach('oficio', pdf, 'oficio.pdf')
      .expect(400);
  });

  it('rejeita arquivo acima de 10 MB', async () => {
    await request(app.getHttpServer())
      .post('/api/reservations')
      .field('dados', JSON.stringify(payload))
      .attach('oficio', Buffer.alloc(10 * 1024 * 1024 + 1), 'oficio.pdf')
      .expect(413);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('rejeita campo de arquivo desconhecido ou duplicado', async () => {
    await submit().attach('outro', pdf, 'outro.pdf').expect(400);
    await submit().attach('oficio', pdf, 'outro.pdf').expect(400);
  });

  it('consulta agenda sem autenticação e valida a data', async () => {
    await request(app.getHttpServer())
      .get('/api/reservations/spaces/1/schedule?date=2099-06-10')
      .expect(200);
    expect(service.schedule).toHaveBeenCalledWith(1, '2099-06-10');
    await request(app.getHttpServer())
      .get('/api/reservations/spaces/1/schedule?date=2099-02-30')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/reservations/spaces/1/schedule')
      .expect(400);
  });

  const routes = [
    { method: 'get' as const, path: '/api/reservations' },
    { method: 'get' as const, path: '/api/reservations/1' },
    { method: 'get' as const, path: '/api/reservations/1/attachments/1' },
    { method: 'patch' as const, path: '/api/reservations/1/status' },
  ];

  it.each(routes)('protege $method $path', async ({ method, path }) => {
    const make = () => request(app.getHttpServer())[method](path);
    await make().expect(401);
    await make().set('Authorization', 'Bearer invalid').expect(401);
    await make().set('Authorization', `Bearer ${user}`).expect(403);
  });

  it('pagina e filtra a listagem administrativa', async () => {
    await request(app.getHttpServer())
      .get('/api/reservations?spaceId=1&status=pending&page=2&limit=5')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith({
      spaceId: 1,
      status: 'pending',
      page: 2,
      limit: 5,
    });
    await request(app.getHttpServer())
      .get('/api/reservations?limit=1000')
      .set('Authorization', `Bearer ${admin}`)
      .expect(400);
  });

  it('aceita decisão administrativa sem aceitar identificação do revisor enviada pelo cliente', async () => {
    await request(app.getHttpServer())
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'approved' })
      .expect(200);
    expect(service.review).toHaveBeenCalledWith(1, { status: 'approved' }, 1);
    await request(app.getHttpServer())
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'approved', reviewedBy: 2 })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/reservations/1/status')
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'pending' })
      .expect(400);
  });

  it('envia binário como download restrito', async () => {
    await request(app.getHttpServer())
      .get('/api/reservations/1/attachments/2')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200)
      .expect('Content-Type', 'application/pdf')
      .expect(
        'Content-Disposition',
        "attachment; filename*=UTF-8''of%C3%ADcio.pdf",
      );
    expect(service.download).toHaveBeenCalledWith(1, 2);
  });
});
