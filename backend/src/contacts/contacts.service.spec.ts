import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ContactMailerService } from './contact-mailer.service';
import { ContactsService } from './contacts.service';
import {
  Contact,
  ContactNotificationStatus,
  ContactStatus,
} from './entities/contact.entity';

describe('ContactsService', () => {
  const payload = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    subject: 'Visita',
    message: 'Quero conhecer o parque.',
  };
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    findAndCount: jest.fn(),
  };
  const mailer = { configured: false, send: jest.fn() };
  const manager = { findOne: jest.fn(), save: jest.fn() };
  const source = { transaction: jest.fn() };
  let service: ContactsService;
  let contact: Contact;

  beforeEach(() => {
    jest.resetAllMocks();
    mailer.configured = false;
    contact = Object.assign(new Contact(), payload, {
      id: 1,
      status: ContactStatus.NEW,
      notificationStatus: ContactNotificationStatus.PENDING,
      notificationAttempts: 0,
      notifiedAt: null,
      createdAt: new Date('2026-11-10T15:00:00Z'),
    });
    repository.create.mockImplementation((data: object) => data);
    repository.save.mockResolvedValue(contact);
    repository.findOneBy.mockResolvedValue(contact);
    repository.update.mockResolvedValue({ affected: 1 });
    manager.findOne.mockResolvedValue(contact);
    manager.save.mockImplementation((_type: unknown, data: Contact) =>
      Promise.resolve(data),
    );
    source.transaction.mockImplementation(
      (callback: (em: EntityManager) => unknown) =>
        callback(manager as unknown as EntityManager),
    );
    service = new ContactsService(
      repository as unknown as Repository<Contact>,
      mailer as unknown as ContactMailerService,
      source as unknown as DataSource,
    );
  });

  it('persiste sem SMTP e retorna somente protocolo, data e confirmação', async () => {
    expect(await service.create(payload)).toEqual({
      id: 1,
      createdAt: contact.createdAt,
      message: 'Mensagem recebida com sucesso.',
    });
    expect(repository.create).toHaveBeenCalledWith({
      ...payload,
      status: 'new',
      notificationStatus: 'pending',
      notificationAttempts: 0,
      notifiedAt: null,
    });
    expect(mailer.send).not.toHaveBeenCalled();
    expect(source.transaction).not.toHaveBeenCalled();
  });

  it('envia após persistir quando SMTP está configurado', async () => {
    mailer.configured = true;
    await service.create(payload);
    expect(repository.save.mock.invocationCallOrder[0]).toBeLessThan(
      mailer.send.mock.invocationCallOrder[0],
    );
    expect(contact.notificationStatus).toBe(ContactNotificationStatus.SENT);
    expect(contact.notificationAttempts).toBe(1);
    expect(contact.notifiedAt).toBeInstanceOf(Date);
    expect(manager.findOne).toHaveBeenCalledWith(Contact, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('preserva a mensagem e retorna sucesso se SMTP falhar', async () => {
    mailer.configured = true;
    mailer.send.mockRejectedValue(new Error('SMTP offline'));
    await expect(service.create(payload)).resolves.toMatchObject({ id: 1 });
    expect(contact.notificationStatus).toBe(ContactNotificationStatus.FAILED);
    expect(contact.notifiedAt).toBeNull();
    expect(contact.notificationAttempts).toBe(1);
  });

  it('continua confirmando recebimento se a transação da notificação falhar', async () => {
    mailer.configured = true;
    source.transaction.mockRejectedValue(new Error('DB offline'));
    await expect(service.create(payload)).resolves.toMatchObject({ id: 1 });
    expect(contact.notificationStatus).toBe(ContactNotificationStatus.PENDING);
  });

  it('não envia nada se a persistência inicial falhar', async () => {
    mailer.configured = true;
    repository.save.mockRejectedValue(new Error('DB offline'));
    await expect(service.create(payload)).rejects.toThrow('DB offline');
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('informa 503 ao tentar notificar sem SMTP', async () => {
    await expect(service.notify(1)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('não reenvia mensagem já aceita pelo SMTP', async () => {
    mailer.configured = true;
    contact.notificationStatus = ContactNotificationStatus.SENT;
    await service.notify(1);
    expect(mailer.send).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('permite repetir uma tentativa falha', async () => {
    mailer.configured = true;
    contact.notificationStatus = ContactNotificationStatus.FAILED;
    contact.notificationAttempts = 1;
    await expect(service.notify(1)).resolves.toMatchObject({
      id: 1,
      notificationStatus: 'sent',
      notificationAttempts: 2,
    });
  });

  it('retorna 404 na consulta, atualização e notificação de id inexistente', async () => {
    mailer.configured = true;
    repository.findOneBy.mockResolvedValue(null);
    repository.update.mockResolvedValue({ affected: 0 });
    manager.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateStatus(99, ContactStatus.READ),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.notify(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('atualiza apenas o estado de atendimento', async () => {
    await service.updateStatus(1, ContactStatus.CLOSED);
    expect(repository.update).toHaveBeenCalledWith(1, { status: 'closed' });
  });

  it('pagina e filtra mensagens', async () => {
    repository.findAndCount.mockResolvedValue([[contact], 4]);
    expect(
      await service.findAll({
        page: 2,
        limit: 2,
        notificationStatus: ContactNotificationStatus.PENDING,
      }),
    ).toEqual({ items: [contact], total: 4, page: 2, limit: 2 });
    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { notificationStatus: 'pending' },
      skip: 2,
      take: 2,
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  });
});
