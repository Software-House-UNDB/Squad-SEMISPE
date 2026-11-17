import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { strict as assert } from 'node:assert';
import type { Server } from 'node:http';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import dataSource from '../src/database/data-source';
import { ReservationAttachment } from '../src/reservations/entities/reservation-attachment.entity';
import {
  Reservation,
  ReservationStatus,
} from '../src/reservations/entities/reservation.entity';
import { Role, User } from '../src/users/entities/user.entity';

/** Requer banco vazio e descartável, criado externamente. Nunca usa o banco semispe. */
async function main(): Promise<void> {
  const database = process.env.DB_DATABASE ?? '';
  assert.match(database, /^semispe_reservations_test_[a-z0-9_]+$/);
  assert.equal(
    process.env.NODE_ENV,
    'production',
    'Desabilite synchronize para testar as migrations.',
  );
  let app: INestApplication<Server> | undefined;
  try {
    await dataSource.initialize();
    const migrations = await dataSource.runMigrations();
    assert.equal(
      migrations.length,
      dataSource.migrations.length,
      'O banco precisa estar vazio.',
    );
    assert.ok(
      migrations.some(
        (migration) => migration.name === 'CreateReservations1794300000000',
      ),
    );
    assert.equal((await dataSource.runMigrations()).length, 0);
    // Reverta também migrations posteriores até alcançar a de reservas.
    const reservationMigrationIndex = migrations.findIndex(
      (migration) => migration.name === 'CreateReservations1794300000000',
    );
    const revertedCount = migrations.length - reservationMigrationIndex;
    for (let i = 0; i < revertedCount; i++)
      await dataSource.undoLastMigration();
    const runner = dataSource.createQueryRunner();
    try {
      assert.equal(await runner.hasTable('reservations'), false);
      assert.equal(await runner.hasTable('reservation_attachments'), false);
    } finally {
      await runner.release();
    }
    assert.equal((await dataSource.runMigrations()).length, revertedCount);
    console.log(
      'Migrations: instalação completa, repetição sem alterações e down/up de reservas OK.',
    );

    app = await NestFactory.create<INestApplication<Server>>(AppModule, {
      logger: ['error'],
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
    const db = app.get(DataSource);
    const users = db.getRepository(User);
    const password = 'ReservationsSmoke123!';
    for (const [email, role] of [
      ['admin@reservations.example', Role.ADMIN],
      ['user@reservations.example', Role.USER],
    ] as const) {
      await users.save(
        users.create({
          name: 'Teste de reservas',
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
    const http = () => request(app!.getHttpServer());
    const adminLogin = await http()
      .post('/api/auth/login')
      .send({ email: 'admin@reservations.example', password })
      .expect(200);
    const userLogin = await http()
      .post('/api/auth/login')
      .send({ email: 'user@reservations.example', password })
      .expect(200);
    const admin = (adminLogin.body as { accessToken: string }).accessToken;
    const user = (userLogin.body as { accessToken: string }).accessToken;
    const userId = (userLogin.body as { user: { id: number } }).user.id;
    assert.ok(admin);
    assert.ok(user);
    const auth = { Authorization: `Bearer ${admin}` };
    await http().post('/api/reservations').send({}).expect(401);
    const createdSpace = await http()
      .post('/api/spaces')
      .set(auth)
      .send({
        name: 'Sala de integração isolada',
        capacity: 30,
        equipment: ['Projetor'],
        photoUrls: [],
      })
      .expect(201);
    const spaceId = (createdSpace.body as { id: number }).id;
    const pdf = Buffer.from('%PDF-1.4\nSmoke test attachment\n%%EOF');
    const payload = {
      requester: {
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '98999999999',
        type: 'pessoa-fisica',
        institution: null,
        document: '52998224725',
      },
      spaceId,
      date: '2099-06-10',
      startTime: '09:00',
      endTime: '10:00',
      participants: 10,
      eventType: 'Reunião',
      equipment: ['Projetor'],
      needsItSupport: false,
      subject: 'Teste isolado',
      consent: true,
    };
    const submit = (change: Record<string, unknown> = {}, content = pdf) => {
      // Cada cenário de persistência tem orçamento próprio; o limite público é
      // exercitado separadamente no teste HTTP e na regressão de integridade.
      app!
        .get<ThrottlerStorageService>(ThrottlerStorage)
        .onApplicationShutdown();
      return http()
        .post('/api/reservations')
        .set('Authorization', `Bearer ${user}`)
        .field('dados', JSON.stringify({ ...payload, ...change }))
        .attach('oficio', content, 'oficio.pdf');
    };
    const idOf = (response: request.Response) =>
      (response.body as { id: number }).id;
    const review = (id: number, status: string) =>
      http()
        .patch(`/api/reservations/${id}/status`)
        .set(auth)
        .send({ status, reviewNote: 'Teste MySQL' });

    await http()
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user}`)
      .field('dados', JSON.stringify(payload))
      .expect(400);
    await submit({}, Buffer.from('invalid file')).expect(400);
    await submit({ participants: 31 }).expect(400);
    await submit({ equipment: ['Equipamento inexistente'] }).expect(400);
    const first = await submit()
      .attach('projeto', pdf, 'projeto.pdf')
      .attach('apresentacao', pdf, 'apresentacao.pdf')
      .attach('pauta', pdf, 'pauta.pdf')
      .expect(201);
    const id = idOf(first);
    assert.deepEqual(Object.keys(first.body as object).sort(), [
      'createdAt',
      'id',
      'status',
    ]);
    const pendingSchedule = await http()
      .get(`/api/reservations/spaces/${spaceId}/schedule?date=${payload.date}`)
      .expect(200);
    assert.deepEqual(
      (pendingSchedule.body as { occupied: unknown[] }).occupied,
      [],
    );
    await http().get(`/api/reservations/${id}`).expect(401);
    await http()
      .get(`/api/reservations/${id}`)
      .set('Authorization', `Bearer ${user}`)
      .expect(403);
    const detail = await http()
      .get(`/api/reservations/${id}`)
      .set(auth)
      .expect(200);
    const stored = detail.body as {
      userId: number;
      requester: typeof payload.requester;
      attachments: { id: number; content?: unknown }[];
    };
    assert.deepEqual(stored.requester, payload.requester);
    assert.equal(stored.userId, userId);
    assert.equal(stored.attachments.length, 4);
    assert.ok(
      stored.attachments.every((attachment) => !('content' in attachment)),
    );
    const attachmentId = stored.attachments[0].id;
    const download = await http()
      .get(`/api/reservations/${id}/attachments/${attachmentId}`)
      .set(auth)
      .expect(200);
    assert.deepEqual(download.body as Buffer, pdf);
    await http()
      .get(`/api/reservations/${id + 10000}/attachments/${attachmentId}`)
      .set(auth)
      .expect(404);
    await http().delete(`/api/spaces/${spaceId}`).set(auth).expect(409);
    console.log(
      'HTTP/MySQL: envio multipart com quatro anexos, persistência, download e permissões OK.',
    );

    // Duas transações, em conexões distintas, disputam o mesmo horário.
    const secondId = idOf(await submit().expect(201));
    const outcomes = await Promise.all([
      review(id, 'approved'),
      review(secondId, 'approved'),
    ]);
    assert.deepEqual(
      outcomes.map((response) => response.status).sort(),
      [200, 409],
    );
    const approvedId = outcomes[0].status === 200 ? id : secondId;
    const waitingId = approvedId === id ? secondId : id;
    assert.equal(
      await db
        .getRepository(Reservation)
        .countBy({ spaceId, status: ReservationStatus.APPROVED }),
      1,
    );
    const schedule = await http()
      .get(`/api/reservations/spaces/${spaceId}/schedule?date=${payload.date}`)
      .expect(200);
    assert.deepEqual((schedule.body as { occupied: unknown[] }).occupied, [
      { startTime: '09:00:00', endTime: '10:00:00' },
    ]);
    await submit({ startTime: '09:30', endTime: '10:30' }).expect(409);
    const adjacentId = idOf(
      await submit({ startTime: '10:00', endTime: '11:00' }).expect(201),
    );
    await review(adjacentId, 'approved').expect(200);
    await review(approvedId, 'cancelled').expect(200);
    await review(waitingId, 'approved').expect(200);
    const list = await http()
      .get(
        `/api/reservations?spaceId=${spaceId}&status=approved&page=1&limit=1`,
      )
      .set(auth)
      .expect(200);
    assert.equal((list.body as { total: number }).total, 2);
    assert.equal((list.body as { items: unknown[] }).items.length, 1);
    console.log(
      'Concorrência: apenas uma aprovação; sobreposição 409, horário adjacente e liberação por cancelamento OK.',
    );

    // Repete disputas reais e cobre duas análises simultâneas do mesmo pedido.
    for (let round = 11; round < 16; round++) {
      const date = `2099-06-${round}`;
      const a = idOf(await submit({ date }).expect(201));
      const b = idOf(await submit({ date }).expect(201));
      const results = await Promise.all([
        review(a, 'approved'),
        review(b, 'approved'),
      ]);
      assert.deepEqual(
        results.map((response) => response.status).sort(),
        [200, 409],
      );
    }
    const sameId = idOf(await submit({ date: '2099-06-20' }).expect(201));
    const same = await Promise.all([
      review(sameId, 'approved'),
      review(sameId, 'rejected'),
    ]);
    assert.deepEqual(
      same.map((response) => response.status).sort(),
      [200, 409],
    );

    // Prova que falha na gravação dos anexos desfaz a reserva no MySQL real.
    const count = await db.getRepository(Reservation).count();
    await db.query(
      "ALTER TABLE reservation_attachments ADD CONSTRAINT reservations_smoke_failure CHECK (originalName <> 'rollback.pdf')",
    );
    try {
      app.useLogger(false);
      await http()
        .post('/api/reservations')
        .set('Authorization', `Bearer ${user}`)
        .field('dados', JSON.stringify({ ...payload, date: '2099-06-21' }))
        .attach('oficio', pdf, 'rollback.pdf')
        .expect(500);
      assert.equal(await db.getRepository(Reservation).count(), count);
    } finally {
      await db.query(
        'ALTER TABLE reservation_attachments DROP CHECK reservations_smoke_failure',
      );
      app.useLogger(['error']);
    }
    const largePdf = Buffer.alloc(10 * 1024 * 1024, 32);
    pdf.copy(largePdf);
    const largeId = idOf(
      await submit({ date: '2099-06-22' }, largePdf).expect(201),
    );
    const largeAttachment = await db
      .getRepository(ReservationAttachment)
      .findOneByOrFail({ reservationId: largeId });
    const largeDownload = await http()
      .get(`/api/reservations/${largeId}/attachments/${largeAttachment.id}`)
      .set(auth)
      .expect(200);
    assert.deepEqual(largeDownload.body as Buffer, largePdf);
    console.log(
      'MySQL: seis disputas entre reservas, análise simultânea do mesmo pedido, rollback e anexo de 10 MB OK.',
    );

    // Conexão independente confirma que os dados estão efetivamente persistidos.
    assert.ok(
      await dataSource.getRepository(Reservation).findOneBy({ id: largeId }),
    );
    const reservationCount = await db.getRepository(Reservation).count();
    await users.delete(userId);
    const preserved = await db
      .getRepository(Reservation)
      .findOneByOrFail({ id });
    assert.equal(preserved.userId, null);
    assert.deepEqual(preserved.requester, payload.requester);
    assert.equal(await db.getRepository(Reservation).count(), reservationCount);
    console.log(
      'Vínculo de conta: ID derivado do JWT e histórico preservado após exclusão da conta.',
    );
    console.log(`Integração completa aprovada no banco isolado ${database}.`);
  } finally {
    await app?.close();
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
