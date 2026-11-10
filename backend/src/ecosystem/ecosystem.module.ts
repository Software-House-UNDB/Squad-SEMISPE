import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { EcosystemActor } from './entities/ecosystem-actor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EcosystemActor]), AuthModule],
  controllers: [EcosystemController],
  providers: [EcosystemService],
})
export class EcosystemModule {}
