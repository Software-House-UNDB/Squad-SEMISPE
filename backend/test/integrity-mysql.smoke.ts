import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { strict as assert } from 'node:assert';
import type { Server } from 'node:http';
import { execFileSync } from 'node:child_process';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import dataSource from '../src/database/data-source';
import { Idea, IdeaStatus } from '../src/ideas/entities/idea.entity';
import {
  Reservation,
  ReservationStatus,
} from '../src/reservations/entities/reservation.entity';
import { Space } from '../src/spaces/entities/space.entity';
import { Role, User } from '../src/users/entities/user.entity';

async function main() {
  assert.match(
    process.env.DB_DATABASE ?? '',
    /^semispe_integrity_test_[a-z0-9_]+$/,
  );
  assert.equal(process.env.NODE_ENV, 'production');
  delete process.env.SMTP_HOST;
  let app: INestApplication<Server> | undefined;
  try {
    await dataSource.initialize();
    const allMigrations = [...dataSource.migrations];
    dataSource.migrations.splice(
      0,
      dataSource.migrations.length,
      ...allMigrations.filter(
        (migration) => migration.name !== 'FixBackendIntegrity1794496000000',
      ),
    );
    assert.equal(
      (await dataSource.runMigrations()).length,
      allMigrations.length - 1,
    );
    // Monta registros no schema anterior e prova que a atualização preserva o histórico.
    const legacy = await dataSource.query<{ insertId: number }>(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
      [
        'Conta anterior',
        'legacy@example.com',
        await bcrypt.hash('LegacyPassword123!', 10),
      ],
    );
    const oldIdea = await dataSource.query<{ insertId: number }>(
      'INSERT INTO ideas (title, category, problem, solution, expectedBenefits, targetAudience, applicationArea, status, authorId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'Ideia anterior',
        'technology',
        'Problema',
        'Solução',
        'Benefícios',
        'População',
        'Cidade',
        'implemented',
        legacy.insertId,
      ],
    );
    dataSource.migrations.splice(
      0,
      dataSource.migrations.length,
      ...allMigrations,
    );
    assert.equal((await dataSource.runMigrations()).length, 1);
    assert.equal(
      await dataSource.getRepository(Idea).countBy({ id: oldIdea.insertId }),
      1,
    );
    assert.equal(
      (
        await dataSource
          .getRepository(User)
          .findOneByOrFail({ id: legacy.insertId })
      ).tokenVersion,
      0,
    );
    await assert.rejects(() =>
      dataSource.getRepository(User).delete(legacy.insertId),
    );
    await dataSource.undoLastMigration();
    assert.equal((await dataSource.runMigrations()).length, 1);
    assert.equal(
      await dataSource.getRepository(Idea).countBy({ id: oldIdea.insertId }),
      1,
    );
    const schema = await dataSource.driver.createSchemaBuilder().log();
    assert.deepEqual(
      schema.upQueries,
      [],
      'Todas as migrations precisam corresponder às entities.',
    );
    console.log(
      'Migration de integridade: upgrade com dados antigos, down/up, FK RESTRICT e schema completo OK.',
    );

    const password = 'IntegrityPassword123!';
    const users = dataSource.getRepository(User);
    for (const [email, role] of [
      ['integrity-admin@example.com', Role.ADMIN],
      ['integrity-user@example.com', Role.USER],
    ] as const) {
      await users.save(
        users.create({
          name: 'Teste de integridade',
          email,
          password: await bcrypt.hash(password, 10),
          role,
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
    const login = async (email: string, pass = password) => {
      const response = await http()
        .post('/api/auth/login')
        .send({ email, password: pass })
        .expect(200);
      return response.body as { accessToken: string; user: { id: number } };
    };
    const admin = await login('integrity-admin@example.com');
    const regular = await login('integrity-user@example.com');
    const auth = { Authorization: `Bearer ${admin.accessToken}` };
    const userAuth = { Authorization: `Bearer ${regular.accessToken}` };
    const userId = regular.user.id;
    const newPassword = 'ChangedIntegrity123!';
    await http()
      .patch(`/api/users/${userId}`)
      .set(userAuth)
      .send({ password: newPassword })
      .expect(200);
    await http().get(`/api/users/${userId}`).set(userAuth).expect(401);
    await http()
      .post('/api/auth/login')
      .send({ email: 'integrity-user@example.com', password })
      .expect(401);
    const newLogin = await login('integrity-user@example.com', newPassword);
    const newUserAuth = { Authorization: `Bearer ${newLogin.accessToken}` };
    const profile = await http()
      .get(`/api/users/${userId}`)
      .set(newUserAuth)
      .expect(200);
    assert.ok(!('password' in (profile.body as object)));
    assert.ok(!('tokenVersion' in (profile.body as object)));
    await http()
      .patch(`/api/users/${userId}`)
      .set(newUserAuth)
      .send({ tokenVersion: 999 })
      .expect(400);
    const legacyToken = await app.get(JwtService).signAsync({
      sub: userId,
      email: 'integrity-user@example.com',
      role: Role.USER,
    });
    await http()
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${legacyToken}`)
      .expect(401);

    const idea = await http()
      .post('/api/ideas')
      .set(newUserAuth)
      .send({
        title: 'Ideia protegida',
        category: 'technology',
        problem: 'Problema',
        solution: 'Solução',
        expectedBenefits: 'Benefícios',
        targetAudience: 'População',
        applicationArea: 'Cidade',
      })
      .expect(201);
    const ideaId = (idea.body as Idea).id;
    await http()
      .patch(`/api/ideas/${ideaId}/status`)
      .set(auth)
      .send({ status: IdeaStatus.IMPLEMENTED })
      .expect(200);
    await http().delete(`/api/ideas/${ideaId}`).set(newUserAuth).expect(409);
    await http().delete(`/api/users/${userId}`).set(newUserAuth).expect(409);
    await http().delete(`/api/users/${userId}`).set(auth).expect(409);
    assert.equal(await users.countBy({ id: userId }), 1);
    assert.equal(
      (await dataSource.getRepository(Idea).findOneByOrFail({ id: ideaId }))
        .status,
      IdeaStatus.IMPLEMENTED,
    );
    // Nem duas trocas concorrentes de senha podem reutilizar a mesma versão.
    await Promise.all([
      http()
        .patch(`/api/users/${userId}`)
        .set(auth)
        .send({ password: 'ConcurrentPasswordA1!' })
        .expect(200),
      http()
        .patch(`/api/users/${userId}`)
        .set(auth)
        .send({ password: 'ConcurrentPasswordB1!' })
        .expect(200),
    ]);
    assert.equal((await users.findOneByOrFail({ id: userId })).tokenVersion, 3);
    await http().get(`/api/users/${userId}`).set(newUserAuth).expect(401);
    const removable = await users.save(
      users.create({
        name: 'Sem ideias',
        email: 'removable@example.com',
        password: await bcrypt.hash(password, 10),
        role: Role.USER,
      }),
    );
    await http().delete(`/api/users/${removable.id}`).set(auth).expect(200);
    assert.equal(await users.countBy({ id: removable.id }), 0);
    console.log(
      'HTTP/MySQL: ideias avaliadas preservadas, exclusão sem vínculo permitida, tokens revogados e trocas concorrentes de senha OK.',
    );

    const roomResult = await http()
      .post('/api/spaces')
      .set(auth)
      .send({ name: 'Sala protegida', capacity: 30, equipment: ['Projetor'] })
      .expect(201);
    const spaceId = (roomResult.body as Space).id;
    const payload = {
      requester: {
        name: 'Solicitante de teste',
        email: 'requester@example.com',
        phone: '98999999999',
        type: 'pessoa-fisica',
        institution: null,
        document: '52998224725',
      },
      spaceId,
      date: '2099-06-10',
      startTime: '09:00',
      endTime: '10:00',
      participants: 20,
      eventType: 'Reunião',
      equipment: ['Projetor'],
      needsItSupport: false,
      subject: 'Teste',
      consent: true,
    };
    const pdf = Buffer.from('%PDF-1.4\nIntegrity fixture\n%%EOF');
    const resetBudget = () =>
      app!
        .get<ThrottlerStorageService>(ThrottlerStorage)
        .onApplicationShutdown();
    const submit = (change: Record<string, unknown> = {}) =>
      http()
        .post('/api/reservations')
        .set(auth)
        .field('dados', JSON.stringify({ ...payload, ...change }))
        .attach('oficio', pdf, 'oficio.pdf');
    const review = (id: number, status: string) =>
      http().patch(`/api/reservations/${id}/status`).set(auth).send({ status });
    resetBudget();
    const created = await submit().expect(201);
    const reservationId = (created.body as Reservation).id;
    await review(reservationId, 'approved').expect(200);
    await http()
      .patch(`/api/spaces/${spaceId}`)
      .set(auth)
      .send({ capacity: 5 })
      .expect(409);
    await http()
      .patch(`/api/spaces/${spaceId}`)
      .set(auth)
      .send({ equipment: [] })
      .expect(409);
    const storedSpace = await dataSource
      .getRepository(Space)
      .findOneByOrFail({ id: spaceId });
    assert.equal(storedSpace.capacity, 30);
    assert.deepEqual(storedSpace.equipment, ['Projetor']);
    await http()
      .patch(`/api/spaces/${spaceId}`)
      .set(auth)
      .send({
        capacity: 40,
        equipment: ['Projetor', 'TV'],
        description: 'Atualização compatível',
      })
      .expect(200);
    await review(reservationId, 'cancelled').expect(200);
    await http()
      .patch(`/api/spaces/${spaceId}`)
      .set(auth)
      .send({ capacity: 5 })
      .expect(200);
    // Reservas históricas não bloqueiam mudanças; reservas em andamento bloqueiam.
    const reservations = dataSource.getRepository(Reservation);
    const reference = await reservations.findOneByOrFail({ id: reservationId });
    const { id: _id, ...original } = reference;
    void _id;
    await reservations.save(
      reservations.create({
        ...original,
        date: '2020-01-01',
        status: ReservationStatus.APPROVED,
      }),
    );
    await http()
      .patch(`/api/spaces/${spaceId}`)
      .set(auth)
      .send({ capacity: 1 })
      .expect(200);
    const today = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
    await reservations.save(
      reservations.create({
        ...original,
        date: today,
        startTime: '00:00:00',
        endTime: '23:59:59',
        participants: 1,
        status: ReservationStatus.APPROVED,
      }),
    );
    await http()
      .patch(`/api/spaces/${spaceId}`)
      .set(auth)
      .send({ equipment: [] })
      .expect(409);
    console.log(
      'Reservas: capacidade/equipamentos protegidos, alterações compatíveis, cancelamento, histórico e evento em andamento OK.',
    );

    for (let round = 0; round < 5; round++) {
      const room = await http()
        .post('/api/spaces')
        .set(auth)
        .send({ name: `Corrida ${round}`, capacity: 10, equipment: [] })
        .expect(201);
      const roomId = (room.body as Space).id;
      resetBudget();
      const pending = await submit({
        spaceId: roomId,
        participants: 8,
        equipment: [],
      }).expect(201);
      const pendingId = (pending.body as Reservation).id;
      const [update, approve] = await Promise.all([
        http().patch(`/api/spaces/${roomId}`).set(auth).send({ capacity: 5 }),
        review(pendingId, 'approved'),
      ]);
      assert.ok(
        (update.status === 200 && approve.status === 400) ||
          (update.status === 409 && approve.status === 200),
        `Estado inconsistente: ${update.status}/${approve.status}`,
      );
      const finalRoom = await dataSource
        .getRepository(Space)
        .findOneByOrFail({ id: roomId });
      const finalReservation = await reservations.findOneByOrFail({
        id: pendingId,
      });
      assert.ok(
        finalReservation.status !== ReservationStatus.APPROVED ||
          finalRoom.capacity >= finalReservation.participants,
      );
    }
    console.log(
      'Concorrência: cinco disputas entre alteração de capacidade e aprovação, sem estado inválido.',
    );

    const blankPartner = {
      name: '   ',
      email: 'partner@example.com',
      description: 'Descrição',
      shortDescription: 'Resumo',
    };
    await http().post('/api/partners').set(auth).send(blankPartner).expect(400);
    await http()
      .post('/api/partners')
      .set(auth)
      .send({
        ...blankPartner,
        name: 'Parceiro',
        description: 'x'.repeat(70000),
      })
      .expect(400);
    await http()
      .post('/api/spaces')
      .set(auth)
      .send({ name: 'Longo', capacity: 1, description: 'x'.repeat(70000) })
      .expect(400);
    const validPartner = await http()
      .post('/api/partners')
      .set(auth)
      .send({
        ...blankPartner,
        name: ' Parceiro ',
        email: ' PARTNER@EXAMPLE.COM ',
      })
      .expect(201);
    assert.equal((validPartner.body as { name: string }).name, 'Parceiro');
    assert.equal(
      (validPartner.body as { email: string }).email,
      'partner@example.com',
    );
    resetBudget();
    for (let i = 0; i < 5; i++)
      await submit({ spaceId, date: '2099-07-01', participants: 1 }).expect(
        201,
      );
    await http()
      .post('/api/reservations')
      .set(auth)
      .set('X-Forwarded-For', '203.0.113.88')
      .send({})
      .expect(429);
    console.log(
      'Validação: payloads antes causadores de 500 agora retornam 400; rate limit bloqueia a sexta tentativa antes do upload.',
    );
    execFileSync('npm', ['run', 'test:e2e', '--', '--runInBand'], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 60000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log('Teste E2E oficial aprovado no banco isolado.');
  } finally {
    await app?.close();
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
