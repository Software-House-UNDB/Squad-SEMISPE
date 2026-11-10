import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContactMailerService } from './contact-mailer.service';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Contact } from './entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact]),
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 5 }],
      errorMessage:
        'Muitas mensagens. Aguarde um minuto antes de tentar novamente.',
    }),
  ],
  controllers: [ContactsController],
  providers: [ContactsService, ContactMailerService],
})
export class ContactsModule {}
