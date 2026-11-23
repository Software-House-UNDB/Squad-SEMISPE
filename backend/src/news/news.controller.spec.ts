import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { Role, User } from '../users/entities/user.entity';
import { News, NewsCategory } from './entities/news.entity';
import { NewsModule } from './news.module';
import { NewsService } from './news.service';

describe('NewsController (HTTP)', () => {
  let app: INestApplication<Server>;
  let admin: string;
  let user: string;
  const payload = {
    title: 'Título da notícia',
    summary: 'Resumo',
    content: 'Texto completo.',
    category: NewsCategory.INNOVATION,
  };
  const news = {
    id: 1,
    ...payload,
    slug: 'titulo-da-noticia',
    status: 'draft',
    publishedAt: null,
  };
  const service = {
    create: jest.fn().mockResolvedValue(news),
    update: jest.fn().mockResolvedValue(news),
    remove: jest.fn().mockResolvedValue(undefined),
    findPublic: jest
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
    findAdmin: jest
      .fn()
      .mockResolvedValue({ items: [news], total: 1, page: 1, limit: 20 }),
    findAdminById: jest.fn().mockResolvedValue(news),
    findPublicById: jest.fn().mockResolvedValue(news),
    findPublicBySlug: jest.fn().mockResolvedValue(news),
    setPublication: jest.fn().mockResolvedValue(news),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({ jwt: { secret: 'news-http-spec', expiresIn: '1h' } }),
          ],
        }),
        NewsModule,
      ],
    })
      .overrideProvider(getRepositoryToken(News))
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
      .overrideProvider(NewsService)
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

  it('disponibiliza categorias, listagem e detalhes públicos', async () => {
    const categories = await http().get('/api/news/categories').expect(200);
    expect(
      (categories.body as { value: string }[]).map(({ value }) => value),
    ).toEqual(Object.values(NewsCategory));
    await http().get('/api/news').expect(200);
    await http().get('/api/news/1').expect(200);
    expect(service.findPublicById).toHaveBeenCalledWith(1);
    await http().get('/api/news/slug/titulo-da-noticia').expect(200);
    expect(service.findPublicBySlug).toHaveBeenCalledWith('titulo-da-noticia');
  });
  it('valida filtros e não aceita consultar rascunhos pela rota pública', async () => {
    await http()
      .get('/api/news?category=startups&search=local&page=2&limit=5')
      .expect(200);
    expect(service.findPublic).toHaveBeenCalledWith({
      category: 'startups',
      search: 'local',
      page: 2,
      limit: 5,
    });
    for (const query of [
      'status=draft',
      'category=invalid',
      'page=0',
      'limit=101',
    ])
      await http().get(`/api/news?${query}`).expect(400);
    await http().get('/api/news/invalid').expect(400);
  });
  it.each([
    { method: 'get' as const, path: '/api/news/admin', status: 200 },
    { method: 'get' as const, path: '/api/news/admin/1', status: 200 },
    { method: 'post' as const, path: '/api/news', status: 201 },
    { method: 'patch' as const, path: '/api/news/1', status: 200 },
    { method: 'delete' as const, path: '/api/news/1', status: 204 },
    { method: 'post' as const, path: '/api/news/1/publish', status: 200 },
    { method: 'post' as const, path: '/api/news/1/unpublish', status: 200 },
  ])('protege $method $path', async ({ method, path, status }) => {
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
    await http()[method](path).set(auth()).send(payload).expect(status);
  });
  it('normaliza textos, aceita categorias e slugs personalizados', async () => {
    for (const category of Object.values(NewsCategory)) {
      await http()
        .post('/api/news')
        .set(auth())
        .send({
          ...payload,
          title: ' Título da notícia ',
          category,
          slug: `noticia-${category.replaceAll('_', '-')}`,
        })
        .expect(201);
      expect(service.create).toHaveBeenLastCalledWith({
        ...payload,
        category,
        slug: `noticia-${category.replaceAll('_', '-')}`,
      });
    }
  });
  it.each([
    {},
    { ...payload, title: '  ' },
    { ...payload, title: null },
    { ...payload, title: 'x'.repeat(201) },
    { ...payload, summary: 'x'.repeat(501) },
    { ...payload, content: '' },
    { ...payload, content: 'x'.repeat(20001) },
    { ...payload, category: 'invalid' },
    { ...payload, imageUrl: 'javascript:alert(1)' },
    { ...payload, imageUrl: 'ftp://example.com' },
    { ...payload, imageUrl: 'https://user:pass@example.com' },
    { ...payload, imageAlt: '  ' },
    { ...payload, slug: 'Notícia inválida' },
    { ...payload, slug: null },
    { ...payload, slug: 'foo--bar' },
    { ...payload, slug: 'x'.repeat(201) },
    { ...payload, publishedAt: '2020-01-01' },
    { ...payload, status: 'published' },
  ])(
    'rejeita dados inválidos e campos controlados pelo servidor: %j',
    async (body) => {
      await http().post('/api/news').set(auth()).send(body).expect(400);
      expect(service.create).not.toHaveBeenCalled();
    },
  );
  it.each(['title', 'summary', 'content', 'category', 'slug'])(
    'PATCH rejeita null em %s',
    async (field) => {
      await http()
        .patch('/api/news/1')
        .set(auth())
        .send({ [field]: null })
        .expect(400);
    },
  );
  it('permite limpar metadados opcionais e editar parcialmente', async () => {
    await http()
      .patch('/api/news/1')
      .set(auth())
      .send({ imageUrl: null, imageAlt: null })
      .expect(200);
    await http()
      .patch('/api/news/1')
      .set(auth())
      .send({ title: 'Novo título' })
      .expect(200);
    expect(service.update).toHaveBeenLastCalledWith(1, {
      title: 'Novo título',
    });
    await http()
      .patch('/api/news/1')
      .set(auth())
      .send({ status: 'published' })
      .expect(400);
    await http()
      .get('/api/news/admin?status=draft&page=1')
      .set(auth())
      .expect(200);
    expect(service.findAdmin).toHaveBeenCalledWith({
      status: 'draft',
      page: 1,
      limit: 20,
    });
  });
});
