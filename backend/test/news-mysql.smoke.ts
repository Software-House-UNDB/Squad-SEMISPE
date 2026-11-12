import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { strict as assert } from 'node:assert';
import type { Server } from 'node:http';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import dataSource from '../src/database/data-source';
import { News, NewsCategory } from '../src/news/entities/news.entity';
import { Role, User } from '../src/users/entities/user.entity';

async function main() {
  assert.match(process.env.DB_DATABASE ?? '', /^semispe_news_test_[a-z0-9_]+$/);
  assert.equal(process.env.NODE_ENV, 'production');
  delete process.env.SMTP_HOST;
  let app: INestApplication<Server> | undefined;
  try {
    await dataSource.initialize();
    const migrations = await dataSource.runMigrations();
    assert.equal(migrations.length, dataSource.migrations.length);
    assert.equal(migrations.at(-1)?.name, 'CreateNews1794490000000');
    assert.equal((await dataSource.runMigrations()).length, 0);
    await dataSource.undoLastMigration();
    const runner = dataSource.createQueryRunner();
    try {
      assert.equal(await runner.hasTable('news'), false);
    } finally {
      await runner.release();
    }
    assert.equal((await dataSource.runMigrations()).length, 1);
    const schema = await dataSource.driver.createSchemaBuilder().log();
    assert.deepEqual(
      schema.upQueries.filter((query) => /\bnews\b/.test(query.query)),
      [],
      'Migration e entity devem corresponder.',
    );
    console.log(
      'Migrations: instalação, down/up, repetição e alinhamento com a entity OK.',
    );

    const password = 'NewsSmoke123!';
    const users = dataSource.getRepository(User);
    for (const [email, role] of [
      ['news-admin@example.com', Role.ADMIN],
      ['news-user@example.com', Role.USER],
    ] as const) {
      await users.save(
        users.create({
          name: 'Teste de notícias',
          email,
          role,
          password: await bcrypt.hash(password, 10),
          institution: null,
          cpf: null,
          cnpj: null,
          phone: null,
        }),
      );
    }
    app = await NestFactory.create<INestApplication<Server>>(AppModule, {
      logger: false,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    const http = () => request(app!.getHttpServer());
    const login = async (email: string) => {
      const response = await http()
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      return (response.body as { accessToken: string }).accessToken;
    };
    const admin = await login('news-admin@example.com');
    const user = await login('news-user@example.com');
    const auth = { Authorization: `Bearer ${admin}` };
    const payload = {
      title: 'Inovação em São Luís',
      summary: 'Notícias do parque.',
      content: 'Primeiro parágrafo.\n\nTexto completo com acentos: inovação.',
      category: NewsCategory.INNOVATION,
    };
    const categories = await http().get('/api/news/categories').expect(200);
    assert.equal((categories.body as unknown[]).length, 5);
    await http().post('/api/news').send(payload).expect(401);
    await http()
      .post('/api/news')
      .set('Authorization', `Bearer ${user}`)
      .send(payload)
      .expect(403);
    const created = await http()
      .post('/api/news')
      .set(auth)
      .send(payload)
      .expect(201);
    const first = created.body as News;
    assert.equal(first.status, 'draft');
    assert.equal(first.publishedAt, null);
    assert.match(first.slug, /^inovacao-em-sao-luis-[a-f0-9-]{36}$/);
    assert.equal(
      (await dataSource.getRepository(News).findOneByOrFail({ id: first.id }))
        .content,
      payload.content,
    );
    await http().get(`/api/news/${first.id}`).expect(404);
    await http().get(`/api/news/slug/${first.slug}`).expect(404);
    await http().get('/api/news?status=draft').expect(400);
    const empty = await http().get('/api/news').expect(200);
    assert.equal((empty.body as { total: number }).total, 0);
    await http().get('/api/news/admin').expect(401);
    await http()
      .get(`/api/news/admin/${first.id}`)
      .set('Authorization', `Bearer ${user}`)
      .expect(403);
    await http().get(`/api/news/admin/${first.id}`).set(auth).expect(200);

    const published = await http()
      .post(`/api/news/${first.id}/publish`)
      .set(auth)
      .expect(200);
    const publishedAt = (published.body as { publishedAt: string }).publishedAt;
    assert.ok(publishedAt);
    await http().get(`/api/news/${first.id}`).expect(200);
    const bySlug = await http().get(`/api/news/slug/${first.slug}`).expect(200);
    assert.equal((bySlug.body as News).content, payload.content);
    const again = await http()
      .post(`/api/news/${first.id}/publish`)
      .set(auth)
      .expect(200);
    assert.equal(
      (again.body as { publishedAt: string }).publishedAt,
      publishedAt,
    );
    await http()
      .patch(`/api/news/${first.id}`)
      .set(auth)
      .send({ title: 'Título atualizado' })
      .expect(200);
    const stable = await http().get(`/api/news/slug/${first.slug}`).expect(200);
    assert.equal((stable.body as News).slug, first.slug);
    assert.equal((stable.body as News).summary, payload.summary);
    assert.equal(
      (stable.body as { publishedAt: string }).publishedAt,
      publishedAt,
    );
    const publicList = await http().get('/api/news').expect(200);
    assert.equal((publicList.body as { total: number }).total, 1);
    assert.ok(
      !('content' in (publicList.body as { items: object[] }).items[0]),
    );
    console.log(
      'HTTP/MySQL: rascunho protegido, publicação, consulta pública por id/slug e endereço estável OK.',
    );

    const publishedIds = [first.id];
    for (const [index, category] of Object.values(NewsCategory).entries()) {
      const result = await http()
        .post('/api/news')
        .set(auth)
        .send({ ...payload, category, slug: `noticia-${index}` })
        .expect(201);
      const id = (result.body as News).id;
      await http().post(`/api/news/${id}/publish`).set(auth).expect(200);
      publishedIds.push(id);
    }
    const paged = await http().get('/api/news?page=2&limit=2').expect(200);
    assert.equal((paged.body as { total: number }).total, 6);
    assert.deepEqual(
      (paged.body as { items: News[] }).items.map(({ id }) => id),
      [...publishedIds].reverse().slice(2, 4),
    );
    const filtered = await http()
      .get('/api/news?category=startups')
      .expect(200);
    assert.equal((filtered.body as { total: number }).total, 1);
    const literalResponse = await http()
      .post('/api/news')
      .set(auth)
      .send({ ...payload, title: 'Resultado 100%_=', slug: 'busca-literal' })
      .expect(201);
    const literalId = (literalResponse.body as News).id;
    await http().post(`/api/news/${literalId}/publish`).set(auth).expect(200);
    const literal = await http()
      .get('/api/news')
      .query({ search: '100%_=' })
      .expect(200);
    assert.equal((literal.body as { total: number }).total, 1);
    const injection = await http()
      .get('/api/news')
      .query({ search: "' OR 1=1 --" })
      .expect(200);
    assert.equal((injection.body as { total: number }).total, 0);

    // A restrição única do MySQL arbitra requisições concorrentes.
    const duplicate = () =>
      http()
        .post('/api/news')
        .set(auth)
        .send({ ...payload, slug: 'mesmo-slug' });
    const results = await Promise.all([duplicate(), duplicate()]);
    assert.deepEqual(
      results.map((response) => response.status).sort(),
      [201, 409],
    );
    const duplicateId = (
      results.find((response) => response.status === 201)!.body as News
    ).id;
    await http()
      .patch(`/api/news/${duplicateId}`)
      .set(auth)
      .send({ slug: first.slug })
      .expect(409);
    assert.equal(
      (
        await dataSource
          .getRepository(News)
          .findOneByOrFail({ id: duplicateId })
      ).slug,
      'mesmo-slug',
    );
    const adminDrafts = await http()
      .get('/api/news/admin?status=draft')
      .set(auth)
      .expect(200);
    assert.equal((adminDrafts.body as { total: number }).total, 1);
    console.log(
      'MySQL: categorias, busca literal, paginação, filtros administrativos e slug único sob concorrência OK.',
    );

    const count = await dataSource.getRepository(News).count();
    await http()
      .post('/api/news')
      .set(auth)
      .send({ ...payload, status: 'published' })
      .expect(400);
    await http()
      .post('/api/news')
      .set(auth)
      .send({ ...payload, publishedAt: '2020-01-01' })
      .expect(400);
    assert.equal(await dataSource.getRepository(News).count(), count);
    await http()
      .patch(`/api/news/${first.id}`)
      .set(auth)
      .send({
        imageUrl: 'https://example.com/news.png',
        imageAlt: 'Imagem da notícia',
      })
      .expect(200);
    await http()
      .patch(`/api/news/${first.id}`)
      .set(auth)
      .send({ imageUrl: null, imageAlt: null })
      .expect(200);
    await Promise.all([
      http()
        .patch(`/api/news/${first.id}`)
        .set(auth)
        .send({ title: 'Alteração concorrente' })
        .expect(200),
      http()
        .patch(`/api/news/${first.id}`)
        .set(auth)
        .send({ summary: 'Resumo concorrente' })
        .expect(200),
    ]);
    const combined = await http().get(`/api/news/${first.id}`).expect(200);
    assert.equal((combined.body as News).title, 'Alteração concorrente');
    assert.equal((combined.body as News).summary, 'Resumo concorrente');
    await http().post(`/api/news/${first.id}/unpublish`).set(auth).expect(200);
    await http().get(`/api/news/${first.id}`).expect(404);
    await http().get(`/api/news/slug/${first.slug}`).expect(404);
    await http().get(`/api/news/admin/${first.id}`).set(auth).expect(200);
    const newDate = await http()
      .post(`/api/news/${first.id}/publish`)
      .set(auth)
      .expect(200);
    assert.ok(
      new Date(
        (newDate.body as { publishedAt: string }).publishedAt,
      ).getTime() >= new Date(publishedAt).getTime(),
    );
    const longText = '新'.repeat(20000);
    await http()
      .patch(`/api/news/${first.id}`)
      .set(auth)
      .send({ content: longText })
      .expect(200);
    assert.equal(
      (await dataSource.getRepository(News).findOneByOrFail({ id: first.id }))
        .content,
      longText,
    );
    await http().delete(`/api/news/${first.id}`).set(auth).expect(204);
    await http().get(`/api/news/${first.id}`).expect(404);
    await http().delete(`/api/news/${first.id}`).set(auth).expect(404);
    await http().post(`/api/news/${first.id}/publish`).set(auth).expect(404);
    console.log(
      'Publicação/edição concorrente, retirada, republicação, limpeza de imagem, texto Unicode longo e exclusão OK.',
    );
  } finally {
    await app?.close();
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
