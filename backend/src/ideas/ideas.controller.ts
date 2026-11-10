import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { Role } from '../users/entities/user.entity';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaStatusDto } from './dto/update-idea-status.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { IdeaCategory, IdeaStatus } from './entities/idea.entity';
import { IdeasService } from './ideas.service';

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

function enumQuery<T extends Record<string, string>>(
  enumType: T,
  field: string,
) {
  return new ParseEnumPipe(enumType, {
    optional: true,
    exceptionFactory: () =>
      new BadRequestException(
        `O filtro ${field} deve ser um dos seguintes: ${Object.values(enumType).join(', ')}.`,
      ),
  });
}

// Todas as rotas exigem login; as de admin acrescentam o RolesGuard.
@Controller('ideas')
@UseGuards(JwtAuthGuard)
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  create(@Body() dto: CreateIdeaDto, @Req() req: AuthenticatedRequest) {
    return this.ideasService.create(dto, req.user.userId);
  }

  // Declarada antes de ':id' para "mine" não ser lido como id.
  @Get('mine')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.ideasService.findMine(req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll(
    @Query('category', enumQuery(IdeaCategory, 'category'))
    category?: IdeaCategory,
    @Query('status', enumQuery(IdeaStatus, 'status')) status?: IdeaStatus,
  ) {
    return this.ideasService.findAll({ category, status });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideasService.findOne(id, req.user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIdeaStatusDto,
  ) {
    return this.ideasService.updateStatus(id, dto.status);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIdeaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideasService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideasService.remove(id, req.user);
  }
}
