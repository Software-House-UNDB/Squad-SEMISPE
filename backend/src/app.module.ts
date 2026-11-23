import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { IdeasModule } from './ideas/ideas.module';
import { SpacesModule } from './spaces/spaces.module';
import { UsersModule } from './users/users.module';
import { PartnersModule } from './partners/partners.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ContactsModule } from './contacts/contacts.module';
import { EcosystemModule } from './ecosystem/ecosystem.module';
import { NewsModule } from './news/news.module';
import { StationsModule } from './stations/stations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    PartnersModule,
    SpacesModule,
    ReservationsModule,
    IdeasModule,
    ContactsModule,
    EcosystemModule,
    NewsModule,
    StationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
