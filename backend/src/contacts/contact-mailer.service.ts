import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';
import { createTransport, Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactMailerService implements OnModuleDestroy {
  private readonly logger = new Logger(ContactMailerService.name);
  private readonly transporter?: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly from?: string;
  private readonly to?: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('mail.host');
    if (!host) {
      this.logger.warn(
        'SMTP não configurado. Mensagens do Fale conosco serão salvas com envio pendente.',
      );
      return;
    }
    this.from = config.get<string>('mail.from');
    this.to = config.get<string>('mail.contactTo');
    const port = config.get<number>('mail.port', 587);
    const user = config.get<string>('mail.user');
    const password = config.get<string>('mail.password');
    if (
      !this.from ||
      !this.to ||
      !isEmail(this.from) ||
      !isEmail(this.to) ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      Boolean(user) !== Boolean(password)
    ) {
      throw new Error(
        'Configuração SMTP inválida. Confira SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM e CONTACT_TO.',
      );
    }
    this.transporter = createTransport({
      host,
      port,
      secure: config.get<boolean>('mail.secure', false),
      requireTLS: config.get<boolean>('mail.requireTls', true),
      ...(user ? { auth: { user, pass: password! } } : {}),
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }

  get configured(): boolean {
    return Boolean(this.transporter);
  }

  async send(contact: Contact): Promise<void> {
    if (!this.transporter) throw new Error('SMTP não configurado.');
    const info = await this.transporter.sendMail({
      from: this.from,
      to: this.to,
      replyTo: contact.email,
      subject: `[Fale conosco #${contact.id}] ${contact.subject}`,
      text: `Mensagem recebida pelo portal do Parque Tecnológico de São Luís.\n\nProtocolo: ${contact.id}\nNome: ${contact.name}\nE-mail: ${contact.email}\nAssunto: ${contact.subject}\n\n${contact.message}`,
    });
    if (info.accepted.length !== 1)
      throw new Error('Destinatário institucional não aceito pelo SMTP.');
  }

  onModuleDestroy() {
    this.transporter?.close();
  }
}
