import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Idea } from './entities/idea.entity';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Idea]), AuthModule],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
