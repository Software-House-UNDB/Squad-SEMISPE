import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ContactMailerService } from './contact-mailer.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import {
  Contact,
  ContactNotificationStatus,
  ContactStatus,
} from './entities/contact.entity';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @InjectRepository(Contact) private readonly contacts: Repository<Contact>,
    private readonly mailer: ContactMailerService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateContactDto) {
    const contact = await this.contacts.save(
      this.contacts.create({
        ...dto,
        status: ContactStatus.NEW,
        notificationStatus: ContactNotificationStatus.PENDING,
        notificationAttempts: 0,
        notifiedAt: null,
      }),
    );
    if (this.mailer.configured) {
      try {
        await this.notify(contact.id);
      } catch {
        // A mensagem já foi recebida; falhas da notificação não exigem novo envio do formulário.
        this.logger.warn(
          `Notificação do contato ${contact.id} pendente de verificação administrativa.`,
        );
      }
    }
    return {
      id: contact.id,
      createdAt: contact.createdAt,
      message: 'Mensagem recebida com sucesso.',
    };
  }

  async findAll(query: QueryContactsDto) {
    const { page, limit, ...where } = query;
    const [items, total] = await this.contacts.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const contact = await this.contacts.findOneBy({ id });
    if (!contact) throw new NotFoundException('Mensagem não encontrada.');
    return contact;
  }

  async updateStatus(id: number, status: ContactStatus) {
    const result = await this.contacts.update(id, { status });
    if (!result.affected)
      throw new NotFoundException('Mensagem não encontrada.');
    return this.findOne(id);
  }

  async notify(id: number) {
    if (!this.mailer.configured)
      throw new ServiceUnavailableException(
        'O envio institucional ainda não foi configurado.',
      );
    return this.dataSource.transaction(async (manager) => {
      const contact = await manager.findOne(Contact, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!contact) throw new NotFoundException('Mensagem não encontrada.');
      // Serializa reenvios e não repete notificações já aceitas pelo SMTP.
      if (contact.notificationStatus !== ContactNotificationStatus.SENT) {
        contact.notificationAttempts++;
        try {
          await this.mailer.send(contact);
          contact.notificationStatus = ContactNotificationStatus.SENT;
          contact.notifiedAt = new Date();
        } catch {
          contact.notificationStatus = ContactNotificationStatus.FAILED;
          this.logger.warn(
            `Falha no envio institucional do contato ${id}. Mensagem preservada para nova tentativa.`,
          );
        }
        await manager.save(Contact, contact);
      }
      return {
        id: contact.id,
        notificationStatus: contact.notificationStatus,
        notificationAttempts: contact.notificationAttempts,
        notifiedAt: contact.notifiedAt,
      };
    });
  }
}
