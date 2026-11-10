import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { strict as assert } from 'node:assert';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import * as bcrypt from 'bcrypt';
import { SMTPServer } from 'smtp-server';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  Contact,
  ContactNotificationStatus,
} from '../src/contacts/entities/contact.entity';
import dataSource from '../src/database/data-source';
import { Role, User } from '../src/users/entities/user.entity';

async function main() {
  assert.match(
    process.env.DB_DATABASE ?? '',
    /^semispe_contacts_test_[a-z0-9_]+$/,
  );
  assert.equal(process.env.NODE_ENV, 'production');
  // A integração nunca usa destinatários nem servidores externos.
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  let app: INestApplication<Server> | undefined;
  let smtp: SMTPServer | undefined;
  try {
    await dataSource.initialize();
    const migrations = await dataSource.runMigrations();
    assert.equal(migrations.length, dataSource.migrations.length);
    assert.equal((await dataSource.runMigrations()).length, 0);
    const contactsIndex = migrations.findIndex(
      (migration) => migration.name === 'CreateContacts1794322000000',
    );
    assert.ok(contactsIndex >= 0);
    const revertedCount = migrations.length - contactsIndex;
    for (let i = 0; i < revertedCount; i++)
      await dataSource.undoLastMigration();
    const runner = dataSource.createQueryRunner();
    try {
      assert.equal(await runner.hasTable('contacts'), false);
    } finally {
      await runner.release();
    }
    assert.equal((await dataSource.runMigrations()).length, revertedCount);
    const password = 'ContactsSmoke123!';
    const users = dataSource.getRepository(User);
    for (const [email, role] of [
      ['contacts-admin@example.com', Role.ADMIN],
      ['contacts-user@example.com', Role.USER],
    ] as const) {
      await users.save(
        users.create({
          name: 'Teste de contatos',
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
    const start = async () => {
      const instance = await NestFactory.create<INestApplication<Server>>(
        AppModule,
        { logger: false },
      );
      instance.setGlobalPrefix('api');
      instance.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      );
      await instance.init();
      return instance;
    };
    app = await start();
    const http = () => request(app!.getHttpServer());
    const login = async (email: string) => {
      const response = await http()
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      return (response.body as { accessToken: string }).accessToken;
    };
    const admin = await login('contacts-admin@example.com');
    const user = await login('contacts-user@example.com');
    const auth = { Authorization: `Bearer ${admin}` };
    const payload = {
      name: 'Maria Silva',
      email: 'maria@example.com',
      subject: 'Visit request',
      message: 'Hello local SMTP.\nCan we visit the park?',
    };
    const submit = () => http().post('/api/contacts').send(payload);
    const first = await http()
      .post('/api/contacts')
      .send({ ...payload, email: ' MARIA@EXAMPLE.COM ', name: ' Maria Silva ' })
      .expect(201);
    const pendingId = (first.body as { id: number }).id;
    assert.deepEqual(Object.keys(first.body as object).sort(), [
      'createdAt',
      'id',
      'message',
    ]);
    const stored = await dataSource
      .getRepository(Contact)
      .findOneByOrFail({ id: pendingId });
    assert.equal(stored.name, payload.name);
    assert.equal(stored.email, payload.email);
    assert.equal(stored.notificationStatus, ContactNotificationStatus.PENDING);
    assert.equal(stored.notificationAttempts, 0);
    await http().get('/api/contacts').expect(401);
    await http()
      .get(`/api/contacts/${pendingId}`)
      .set('Authorization', `Bearer ${user}`)
      .expect(403);
    await http()
      .post(`/api/contacts/${pendingId}/notification`)
      .set(auth)
      .expect(503);
    await http()
      .post('/api/contacts')
      .send({ ...payload, email: 'invalid' })
      .expect(400);
    await http()
      .post('/api/contacts')
      .send({ ...payload, to: 'attacker@example.com' })
      .expect(400);
    const listing = await http()
      .get('/api/contacts?notificationStatus=pending&page=1&limit=1')
      .set(auth)
      .expect(200);
    assert.equal((listing.body as { total: number }).total, 1);
    await http()
      .patch(`/api/contacts/${pendingId}/status`)
      .set(auth)
      .send({ status: 'read' })
      .expect(200);
    await http()
      .patch(`/api/contacts/${pendingId}/status`)
      .set(auth)
      .send({ status: 'closed' })
      .expect(200);
    assert.equal(
      (
        await dataSource
          .getRepository(Contact)
          .findOneByOrFail({ id: pendingId })
      ).status,
      'closed',
    );
    await http().get('/api/contacts/999999').set(auth).expect(404);
    await submit().expect(201);
    await submit().expect(201);
    await submit().expect(429);
    console.log(
      'MySQL/HTTP sem SMTP: migrations down/up, persistência, normalização, permissões, estados, filtros e limite de envio OK.',
    );
    await app.close();
    app = undefined;

    let reject = false;
    const messages: { from: string; to: string[]; raw: string }[] = [];
    smtp = new SMTPServer({
      disabledCommands: ['STARTTLS', 'AUTH'],
      disableReverseLookup: true,
      logger: false,
      onRcptTo(_address, _session, callback) {
        callback(
          reject
            ? Object.assign(new Error('Recipient rejected for test'), {
                responseCode: 550,
              })
            : undefined,
        );
      },
      onData(stream, session, callback) {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', callback);
        stream.on('end', () => {
          messages.push({
            from: session.envelope.mailFrom
              ? session.envelope.mailFrom.address
              : '',
            to: session.envelope.rcptTo.map((recipient) => recipient.address),
            raw: Buffer.concat(chunks).toString('utf8'),
          });
          callback();
        });
      },
    });
    await new Promise<void>((resolve, rejectListen) => {
      smtp!.once('error', rejectListen);
      smtp!.listen(0, '127.0.0.1', resolve);
    });
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = String((smtp.server.address() as AddressInfo).port);
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_REQUIRE_TLS = 'false';
    process.env.MAIL_FROM = 'portal@example.com';
    process.env.CONTACT_TO = 'institution@example.com';
    app = await start();
    const configured = await submit().expect(201);
    const sentId = (configured.body as { id: number }).id;
    const sent = await dataSource
      .getRepository(Contact)
      .findOneByOrFail({ id: sentId });
    assert.equal(sent.notificationStatus, ContactNotificationStatus.SENT);
    assert.equal(sent.notificationAttempts, 1);
    assert.ok(sent.notifiedAt);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].from, 'portal@example.com');
    assert.deepEqual(messages[0].to, ['institution@example.com']);
    assert.match(messages[0].raw, /Reply-To: maria@example.com/i);
    assert.match(messages[0].raw, /Hello local SMTP/);
    await http()
      .post(`/api/contacts/${sentId}/notification`)
      .set(auth)
      .expect(201);
    assert.equal(
      messages.length,
      1,
      'Notificação já enviada não deve ser repetida.',
    );

    reject = true;
    const failure = await submit().expect(201);
    const failedId = (failure.body as { id: number }).id;
    assert.equal(
      (
        await dataSource
          .getRepository(Contact)
          .findOneByOrFail({ id: failedId })
      ).notificationStatus,
      ContactNotificationStatus.FAILED,
    );
    reject = false;
    const retry = () =>
      http().post(`/api/contacts/${failedId}/notification`).set(auth);
    await Promise.all([retry().expect(201), retry().expect(201)]);
    assert.equal(
      messages.length,
      2,
      'Reenvios simultâneos devem produzir apenas um envio.',
    );
    const retried = await dataSource
      .getRepository(Contact)
      .findOneByOrFail({ id: failedId });
    assert.equal(retried.notificationStatus, ContactNotificationStatus.SENT);
    assert.equal(retried.notificationAttempts, 2);
    await http()
      .post(`/api/contacts/${pendingId}/notification`)
      .set(auth)
      .expect(201);
    assert.equal(
      messages.length,
      3,
      'Pedido recebido antes da configuração deve poder ser notificado depois.',
    );
    const db = app.get(DataSource);
    assert.equal(
      await db
        .getRepository(Contact)
        .countBy({ notificationStatus: ContactNotificationStatus.SENT }),
      3,
    );
    console.log(
      'SMTP local: destinatário fixo, Reply-To, falha preservada, reenvio concorrente sem duplicação e envio de pendência anterior OK.',
    );
    console.log(
      'Integração de Fale conosco aprovada. Nenhum e-mail externo enviado.',
    );
  } finally {
    await app?.close();
    if (smtp) await new Promise<void>((resolve) => smtp!.close(resolve));
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
