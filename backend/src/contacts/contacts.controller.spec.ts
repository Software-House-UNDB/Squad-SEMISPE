import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { Role, User } from '../users/entities/user.entity';
import { ContactMailerService } from './contact-mailer.service';
import { ContactsModule } from './contacts.module';
import { ContactsService } from './contacts.service';
import { Contact } from './entities/contact.entity';

describe('ContactsController (HTTP)', () => {
  let app: INestApplication<Server>;
  let admin: string;
  let user: string;
  const storage = new ThrottlerStorageService();
  const payload = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    subject: 'Visita',
    message: 'Quero conhecer o parque.',
  };
  const service = {
    create: jest.fn().mockResolvedValue({
      id: 1,
      createdAt: '2026-11-10T15:00:00Z',
      message: 'Mensagem recebida com sucesso.',
    }),
    findAll: jest
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
    findOne: jest.fn().mockResolvedValue({ id: 1, ...payload }),
    updateStatus: jest.fn().mockResolvedValue({ id: 1, status: 'read' }),
    notify: jest.fn().mockResolvedValue({ id: 1, notificationStatus: 'sent' }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({ jwt: { secret: 'contacts-http-spec', expiresIn: '1h' } }),
          ],
        }),
        ContactsModule,
      ],
    })
      .overrideProvider(ContactsService)
      .useValue(service)
      .overrideProvider(ContactMailerService)
      .useValue({ configured: false })
      .overrideProvider(ThrottlerStorage)
      .useValue(storage)
      .overrideProvider(getRepositoryToken(Contact))
      .useValue({})
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
  beforeEach(() => {
    jest.clearAllMocks();
    storage.onApplicationShutdown();
  });
  afterAll(async () => {
    await app?.close();
  });
  const http = () => request(app.getHttpServer());

  it('recebe mensagem sem autenticação e normaliza nome, e-mail e texto', async () => {
    await http()
      .post('/api/contacts')
      .send({
        ...payload,
        name: ' Maria Silva ',
        email: ' MARIA@EXAMPLE.COM ',
        subject: ' Visita ',
        message: ' Quero conhecer o parque. ',
      })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(payload);
  });

  it.each([
    {},
    { ...payload, name: null },
    { ...payload, name: '  ' },
    { ...payload, email: 'invalid' },
    { ...payload, subject: '' },
    { ...payload, message: '  ' },
    { ...payload, message: 'x'.repeat(5001) },
    { ...payload, subject: 'x'.repeat(151) },
    { ...payload, email: 'x'.repeat(250) + '@example.com' },
    { ...payload, name: 'Maria\r\nBcc: attacker@example.com' },
    { ...payload, subject: 'Visita\nBcc: attacker@example.com' },
    { ...payload, status: 'closed' },
    { ...payload, to: 'attacker@example.com' },
    { ...payload, notificationStatus: 'sent' },
    { ...payload, message: { text: 'oi' } },
  ])('rejeita payload inválido ou campos extras: %j', async (body) => {
    await http().post('/api/contacts').send(body).expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('limita o envio público a cinco tentativas por minuto', async () => {
    for (let i = 0; i < 5; i++)
      await http().post('/api/contacts').send(payload).expect(201);
    await http().post('/api/contacts').send(payload).expect(429);
    expect(service.create).toHaveBeenCalledTimes(5);
  });

  it.each([
    { method: 'get' as const, path: '/api/contacts' },
    { method: 'get' as const, path: '/api/contacts/1' },
    { method: 'patch' as const, path: '/api/contacts/1/status' },
    { method: 'post' as const, path: '/api/contacts/1/notification' },
  ])('protege $method $path', async ({ method, path }) => {
    await http()[method](path).expect(401);
    await http()
      [method](path)
      .set('Authorization', 'Bearer invalid')
      .expect(401);
    await http()
      [method](path)
      .set('Authorization', `Bearer ${user}`)
      .expect(403);
  });

  it('pagina e filtra consulta administrativa', async () => {
    await http()
      .get('/api/contacts?status=new&notificationStatus=pending&page=2&limit=5')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith({
      status: 'new',
      notificationStatus: 'pending',
      page: 2,
      limit: 5,
    });
    await http()
      .get('/api/contacts?limit=101')
      .set('Authorization', `Bearer ${admin}`)
      .expect(400);
    await http()
      .get('/api/contacts?status=invalid')
      .set('Authorization', `Bearer ${admin}`)
      .expect(400);
  });

  it('permite consulta, alteração de estado e notificação pelo administrador', async () => {
    const auth = { Authorization: `Bearer ${admin}` };
    await http().get('/api/contacts/1').set(auth).expect(200);
    await http()
      .patch('/api/contacts/1/status')
      .set(auth)
      .send({ status: 'read' })
      .expect(200);
    expect(service.updateStatus).toHaveBeenCalledWith(1, 'read');
    await http().post('/api/contacts/1/notification').set(auth).expect(201);
    expect(service.notify).toHaveBeenCalledWith(1);
    await http()
      .patch('/api/contacts/1/status')
      .set(auth)
      .send({ status: 'read', email: 'attacker@example.com' })
      .expect(400);
    await http()
      .patch('/api/contacts/1/status')
      .set(auth)
      .send({ status: null })
      .expect(400);
    await http().get('/api/contacts/invalid').set(auth).expect(400);
  });
});
