import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { strict as assert } from 'node:assert';
import type { Server } from 'node:http';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import dataSource from '../src/database/data-source';
import {
  EcosystemActor,
  EcosystemCategory,
} from '../src/ecosystem/entities/ecosystem-actor.entity';
import { Role, User } from '../src/users/entities/user.entity';

async function main() {
  assert.match(
    process.env.DB_DATABASE ?? '',
    /^semispe_ecosystem_test_[a-z0-9_]+$/,
  );
  assert.equal(process.env.NODE_ENV, 'production');
  delete process.env.SMTP_HOST;
  let app: INestApplication<Server> | undefined;
  try {
    await dataSource.initialize();
    const migrations = await dataSource.runMigrations();
    assert.equal(migrations.length, dataSource.migrations.length);
    assert.equal((await dataSource.runMigrations()).length, 0);
    assert.equal(migrations.at(-1)?.name, 'CreateEcosystemActors1794323000000');
    await dataSource.undoLastMigration();
    const runner = dataSource.createQueryRunner();
    try {
      assert.equal(await runner.hasTable('ecosystem_actors'), false);
    } finally {
      await runner.release();
    }
    assert.equal((await dataSource.runMigrations()).length, 1);
    const schema = await dataSource.driver.createSchemaBuilder().log();
    assert.deepEqual(
      schema.upQueries.filter((query) =>
        query.query.includes('ecosystem_actors'),
      ),
      [],
      'Migration e entity precisam estar alinhadas.',
    );
    console.log(
      'Migrations: instalação, repetição, down/up e alinhamento com a entity OK.',
    );

    const password = 'EcosystemSmoke123!';
    const users = dataSource.getRepository(User);
    for (const [email, role] of [
      ['ecosystem-admin@example.com', Role.ADMIN],
      ['ecosystem-user@example.com', Role.USER],
    ] as const) {
      await users.save(
        users.create({
          name: 'Teste de ecossistema',
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
      const result = await http()
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      return (result.body as { accessToken: string }).accessToken;
    };
    const admin = await login('ecosystem-admin@example.com');
    const user = await login('ecosystem-user@example.com');
    const auth = { Authorization: `Bearer ${admin}` };
    const payload = {
      name: 'Ator local',
      category: EcosystemCategory.STARTUP,
      description: 'Participante do ecossistema de São Luís.',
    };
    await http().post('/api/ecosystem/actors').send(payload).expect(401);
    await http()
      .post('/api/ecosystem/actors')
      .set('Authorization', `Bearer ${user}`)
      .send(payload)
      .expect(403);
    const categories = await http()
      .get('/api/ecosystem/categories')
      .expect(200);
    assert.equal((categories.body as unknown[]).length, 6);
    const ids: number[] = [];
    for (const [index, category] of Object.values(
      EcosystemCategory,
    ).entries()) {
      const location =
        index === 0
          ? { latitude: -2.53, longitude: -44.3 }
          : index === 2
            ? { latitude: 0, longitude: 0 }
            : {};
      const response = await http()
        .post('/api/ecosystem/actors')
        .set(auth)
        .send({
          ...payload,
          name: ` Ator ${index} `,
          category,
          city: ' São Luís ',
          state: ' ma ',
          ...location,
        })
        .expect(201);
      const actor = response.body as EcosystemActor;
      ids.push(actor.id);
      assert.equal(actor.name, `Ator ${index}`);
      assert.equal(actor.state, 'MA');
      const listed = await http()
        .get('/api/ecosystem/actors')
        .query({ category })
        .expect(200);
      assert.equal((listed.body as { total: number }).total, 1);
      assert.equal(
        (
          await dataSource
            .getRepository(EcosystemActor)
            .findOneByOrFail({ id: actor.id })
        ).category,
        category,
      );
    }
    const page = await http()
      .get('/api/ecosystem/actors?page=2&limit=2')
      .expect(200);
    assert.equal((page.body as { total: number }).total, 6);
    assert.deepEqual(
      (page.body as { items: EcosystemActor[] }).items.map(({ name }) => name),
      ['Ator 2', 'Ator 3'],
    );
    const located = await http()
      .get('/api/ecosystem/actors?hasLocation=true')
      .expect(200);
    assert.equal((located.body as { total: number }).total, 2);
    const missingLocation = await http()
      .get('/api/ecosystem/actors?hasLocation=false')
      .expect(200);
    assert.equal((missingLocation.body as { total: number }).total, 4);
    const map = await http().get('/api/ecosystem/map').expect(200);
    const geo = map.body as {
      type: string;
      total: number;
      features: { geometry: { coordinates: number[] } }[];
    };
    assert.equal(geo.type, 'FeatureCollection');
    assert.equal(geo.total, 2);
    assert.deepEqual(
      geo.features.map((feature) => feature.geometry.coordinates),
      [
        [-44.3, -2.53],
        [0, 0],
      ],
    );
    console.log(
      'HTTP/MySQL: seis categorias, CRUD administrativo, consulta pública, filtros, paginação e mapa GeoJSON OK.',
    );

    const literal = await http()
      .post('/api/ecosystem/actors')
      .set(auth)
      .send({ ...payload, name: 'Ator 100%_=' })
      .expect(201);
    const literalId = (literal.body as EcosystemActor).id;
    const search = await http()
      .get('/api/ecosystem/actors')
      .query({ search: '100%_=' })
      .expect(200);
    assert.equal((search.body as { total: number }).total, 1);
    assert.equal(
      (search.body as { items: EcosystemActor[] }).items[0].id,
      literalId,
    );
    const injection = await http()
      .get('/api/ecosystem/actors')
      .query({ search: "' OR 1=1 --" })
      .expect(200);
    assert.equal((injection.body as { total: number }).total, 0);
    const citySearch = await http()
      .get('/api/ecosystem/actors')
      .query({ search: 'São Luís', category: EcosystemCategory.COMPANY })
      .expect(200);
    assert.equal((citySearch.body as { total: number }).total, 1);

    const id = ids[0];
    await http()
      .patch(`/api/ecosystem/actors/${id}`)
      .set(auth)
      .send({ latitude: null })
      .expect(400);
    assert.equal(
      (await dataSource.getRepository(EcosystemActor).findOneByOrFail({ id }))
        .latitude,
      -2.53,
    );
    await Promise.all([
      http()
        .patch(`/api/ecosystem/actors/${id}`)
        .set(auth)
        .send({ latitude: -2.54 })
        .expect(200),
      http()
        .patch(`/api/ecosystem/actors/${id}`)
        .set(auth)
        .send({ longitude: -44.31 })
        .expect(200),
    ]);
    const combined = await http()
      .get(`/api/ecosystem/actors/${id}`)
      .expect(200);
    assert.equal((combined.body as EcosystemActor).latitude, -2.54);
    assert.equal((combined.body as EcosystemActor).longitude, -44.31);
    assert.equal((combined.body as EcosystemActor).name, 'Ator 0');
    await http()
      .patch(`/api/ecosystem/actors/${id}`)
      .set(auth)
      .send({
        latitude: null,
        longitude: null,
        websiteUrl: 'https://example.com',
        logoUrl: 'https://example.com/logo.png',
      })
      .expect(200);
    await http()
      .patch(`/api/ecosystem/actors/${id}`)
      .set(auth)
      .send({ websiteUrl: null, logoUrl: null })
      .expect(200);
    const cleared = await http().get(`/api/ecosystem/actors/${id}`).expect(200);
    assert.equal((cleared.body as EcosystemActor).latitude, null);
    assert.equal((cleared.body as EcosystemActor).websiteUrl, null);
    const remainingMap = await http().get('/api/ecosystem/map').expect(200);
    assert.equal((remainingMap.body as { total: number }).total, 1);
    await http()
      .delete(`/api/ecosystem/actors/${literalId}`)
      .set(auth)
      .expect(204);
    await http().get(`/api/ecosystem/actors/${literalId}`).expect(404);
    await http()
      .delete(`/api/ecosystem/actors/${literalId}`)
      .set(auth)
      .expect(404);
    await http()
      .patch(`/api/ecosystem/actors/${literalId}`)
      .set(auth)
      .send({ name: 'Novo nome' })
      .expect(404);
    console.log(
      'MySQL: busca literal/parametrizada, edição concorrente, preservação de omitidos, limpeza de opcionais e exclusão OK.',
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
