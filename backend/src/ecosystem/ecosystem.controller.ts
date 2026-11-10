import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../users/entities/user.entity';
import { CreateEcosystemActorDto } from './dto/create-ecosystem-actor.dto';
import { QueryEcosystemDto } from './dto/query-ecosystem.dto';
import { UpdateEcosystemActorDto } from './dto/update-ecosystem-actor.dto';
import { ECOSYSTEM_CATEGORIES, EcosystemService } from './ecosystem.service';

@Controller('ecosystem')
export class EcosystemController {
  constructor(private readonly ecosystem: EcosystemService) {}

  @Get('categories')
  categories() {
    return ECOSYSTEM_CATEGORIES;
  }

  @Get('map')
  map(@Query() query: QueryEcosystemDto) {
    return this.ecosystem.map(query);
  }

  @Get('actors')
  findAll(@Query() query: QueryEcosystemDto) {
    return this.ecosystem.findAll(query);
  }

  @Get('actors/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ecosystem.findOne(id);
  }

  @Post('actors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateEcosystemActorDto) {
    return this.ecosystem.create(dto);
  }

  @Patch('actors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEcosystemActorDto,
  ) {
    return this.ecosystem.update(id, dto);
  }

  @Delete('actors/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ecosystem.remove(id);
  }
}
