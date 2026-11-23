import { Module } from '@nestjs/common';
import { RateLimitModule } from '../common/rate-limit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContactMailerService } from './contact-mailer.service';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Contact } from './entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), AuthModule, RateLimitModule],
  controllers: [ContactsController],
  providers: [ContactsService, ContactMailerService],
})
export class ContactsModule {}
