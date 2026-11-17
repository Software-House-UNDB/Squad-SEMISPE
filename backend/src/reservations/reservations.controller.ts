import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { Role } from '../users/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import {
  QueryReservationsDto,
  ReservationDateQueryDto,
} from './dto/query-reservations.dto';
import { ReviewReservationDto } from './dto/review-reservation.dto';
import { AttachmentKind } from './entities/reservation-attachment.entity';
import { ParseReservationPipe } from './parse-reservation.pipe';
import {
  MAX_ATTACHMENT_SIZE,
  type ReservationFiles,
} from './reservation-files';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      Object.values(AttachmentKind).map((name) => ({ name, maxCount: 1 })),
      {
        limits: {
          fileSize: MAX_ATTACHMENT_SIZE,
          files: 4,
          fields: 1,
          fieldSize: 64 * 1024,
          parts: 5,
        },
      },
    ),
  )
  create(
    // O JSON multipart é convertido e validado pelo pipe específico.
    @Body('dados', ParseReservationPipe)
    dto: Pick<CreateReservationDto, keyof CreateReservationDto>,
    @UploadedFiles() files: ReservationFiles,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.reservations.create(dto, files, request.user.userId);
  }

  @Get('spaces/:spaceId/schedule')
  schedule(
    @Param('spaceId', ParseIntPipe) spaceId: number,
    @Query() query: ReservationDateQueryDto,
  ) {
    return this.reservations.schedule(spaceId, query.date);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@Query() query: QueryReservationsDto) {
    return this.reservations.findAll(query);
  }

  @Get('summary')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  summary() {
    return this.reservations.summary();
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservations.findOne(id);
  }

  @Patch(':id/status')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewReservationDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.reservations.review(id, dto, request.user.userId);
  }

  @Get(':id/attachments/:attachmentId')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    const attachment = await this.reservations.download(id, attachmentId);
    return new StreamableFile(attachment.content, {
      type: attachment.mimeType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
      length: attachment.size,
    });
  }
}
