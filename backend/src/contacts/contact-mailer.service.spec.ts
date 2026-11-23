import { ConfigService } from '@nestjs/config';
import { ContactMailerService } from './contact-mailer.service';

describe('ContactMailerService - configuração', () => {
  it('permite iniciar sem configuração de SMTP', () => {
    const service = new ContactMailerService(new ConfigService({}));
    expect(service.configured).toBe(false);
    service.onModuleDestroy();
  });

  it.each([
    {},
    { from: 'invalid', contactTo: 'contato@example.com' },
    { from: 'portal@example.com', contactTo: 'invalid' },
    { from: 'portal@example.com', contactTo: 'contato@example.com', port: 0 },
    {
      from: 'portal@example.com',
      contactTo: 'contato@example.com',
      user: 'smtp-user',
    },
    {
      from: 'portal@example.com',
      contactTo: 'contato@example.com',
      password: 'smtp-password',
    },
  ])('rejeita configuração SMTP parcial ou inválida %j', (config) => {
    expect(
      () =>
        new ContactMailerService(
          new ConfigService({ mail: { host: 'localhost', ...config } }),
        ),
    ).toThrow('Configuração SMTP inválida');
  });

  it('aceita configuração completa sem abrir conexão no startup', () => {
    const service = new ContactMailerService(
      new ConfigService({
        mail: {
          host: '127.0.0.1',
          port: 1025,
          from: 'portal@example.com',
          contactTo: 'contato@example.com',
          requireTls: false,
        },
      }),
    );
    expect(service.configured).toBe(true);
    service.onModuleDestroy();
  });
});
