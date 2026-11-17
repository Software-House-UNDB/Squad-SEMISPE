import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Space, SpaceState } from '../spaces/entities/space.entity';
import { SpacesService } from '../spaces/spaces.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { ReviewReservationDto } from './dto/review-reservation.dto';
import { ReservationAttachment } from './entities/reservation-attachment.entity';
import {
  RequesterType,
  Reservation,
  ReservationStatus,
} from './entities/reservation.entity';
import { ReservationFiles, validateFiles } from './reservation-files';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservations: Repository<Reservation>,
    @InjectRepository(ReservationAttachment)
    private readonly attachments: Repository<ReservationAttachment>,
    private readonly spaces: SpacesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateReservationDto,
    files: ReservationFiles,
    userId?: number,
  ) {
    this.validateRequest(dto);
    const uploads = validateFiles(files);
    await this.spaces.findOne(dto.spaceId);
    return this.dataSource.transaction(async (manager) => {
      const space = await this.lockSpace(manager, dto.spaceId);
      this.validateSpace(space, dto);
      await this.assertAvailable(manager, dto);
      const reservation = await manager.save(
        Reservation,
        manager.create(Reservation, {
          ...dto,
          userId: userId ?? null,
          status: ReservationStatus.PENDING,
          reviewNote: null,
          reviewedBy: null,
          reviewedAt: null,
        }),
      );
      await manager.save(
        ReservationAttachment,
        uploads.map((upload) =>
          manager.create(ReservationAttachment, {
            ...upload,
            reservationId: reservation.id,
          }),
        ),
      );
      // A resposta pública não repete os dados pessoais nem os anexos.
      return {
        id: reservation.id,
        status: reservation.status,
        createdAt: reservation.createdAt,
      };
    });
  }

  async findAll(query: QueryReservationsDto) {
    const { page, limit, ...where } = query;
    const [items, total] = await this.reservations.findAndCount({
      where,
      relations: { space: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async summary() {
    const rows = await this.reservations
      .createQueryBuilder('reservation')
      .select('reservation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('reservation.status')
      .getRawMany<{ status: ReservationStatus; count: string }>();
    const counts = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    for (const row of rows) counts[row.status] = Number(row.count);
    return {
      ...counts,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    };
  }

  async findOne(id: number) {
    const reservation = await this.reservations.findOneBy({ id });
    if (!reservation) throw new NotFoundException('Reserva não encontrada.');
    const attachments = await this.attachments.find({
      where: { reservationId: id },
      order: { id: 'ASC' },
    });
    const space = await this.spaces.findOne(reservation.spaceId);
    return { ...reservation, space, attachments };
  }

  async schedule(spaceId: number, date: string) {
    const space = await this.spaces.findOne(spaceId);
    const reservations = await this.reservations.find({
      where: { spaceId, date, status: ReservationStatus.APPROVED },
      select: { startTime: true, endTime: true },
      order: { startTime: 'ASC' },
    });
    return {
      spaceId,
      date,
      active: space.state === SpaceState.ACTIVE,
      occupied: reservations,
    };
  }

  async review(id: number, dto: ReviewReservationDto, adminId: number) {
    // Todas as escritas de agenda bloqueiam primeiro o espaço, na mesma ordem.
    const existing = await this.reservations.findOneBy({ id });
    if (!existing) throw new NotFoundException('Reserva não encontrada.');
    return this.dataSource.transaction(async (manager) => {
      const space = await this.lockSpace(manager, existing.spaceId);
      const reservation = await manager.findOne(Reservation, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Reserva não encontrada.');
      const canCancel =
        dto.status === ReservationStatus.CANCELLED &&
        [ReservationStatus.PENDING, ReservationStatus.APPROVED].includes(
          reservation.status,
        );
      if (reservation.status !== ReservationStatus.PENDING && !canCancel) {
        throw new ConflictException('Esta reserva já foi analisada.');
      }
      if (dto.status === ReservationStatus.APPROVED) {
        this.validateSpace(space, reservation);
        this.validatePeriod(reservation);
        await this.assertAvailable(manager, reservation);
      }
      reservation.status = dto.status;
      reservation.reviewNote = dto.reviewNote ?? null;
      reservation.reviewedBy = adminId;
      reservation.reviewedAt = new Date();
      return manager.save(Reservation, reservation);
    });
  }

  async download(reservationId: number, attachmentId: number) {
    const attachment = await this.attachments.findOne({
      where: { id: attachmentId, reservationId },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        content: true,
        size: true,
      },
    });
    if (!attachment) throw new NotFoundException('Anexo não encontrado.');
    return attachment;
  }

  private validateRequest(dto: CreateReservationDto) {
    this.validatePeriod(dto);
    const institution = dto.requester.type === RequesterType.INSTITUTION;
    if (
      dto.requester.document.length !== (institution ? 14 : 11) ||
      !this.validDocument(dto.requester.document)
    ) {
      throw new BadRequestException(
        'CPF ou CNPJ inválido para o tipo de solicitante.',
      );
    }
    if (!institution && dto.requester.institution != null) {
      throw new BadRequestException(
        'Pessoa física não deve informar instituição.',
      );
    }
  }

  private validDocument(document: string) {
    if (/^(\d)\1+$/.test(document)) return false;
    const digits = [...document].map(Number);
    const cpf = digits.length === 11;
    for (
      let position = digits.length - 2;
      position < digits.length;
      position++
    ) {
      const sum = digits.slice(0, position).reduce((total, digit, index) => {
        const weight = cpf
          ? position + 1 - index
          : ((position - 1 - index) % 8) + 2;
        return total + digit * weight;
      }, 0);
      const remainder = sum % 11;
      const expected = cpf
        ? ((sum * 10) % 11) % 10
        : remainder < 2
          ? 0
          : 11 - remainder;
      if (digits[position] !== expected) return false;
    }
    return true;
  }

  private validatePeriod(
    dto: Pick<Reservation, 'date' | 'startTime' | 'endTime'>,
  ) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException(
        'O término deve ser posterior ao início, no mesmo dia.',
      );
    }
    // São Luís usa UTC-03:00. O contrato recebe data e horários locais.
    const start = new Date(`${dto.date}T${dto.startTime.slice(0, 5)}:00-03:00`);
    if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) {
      throw new BadRequestException('A reserva deve começar no futuro.');
    }
  }

  private validateSpace(
    space: Space,
    dto: Pick<Reservation, 'participants' | 'equipment'>,
  ) {
    if (space.state !== SpaceState.ACTIVE)
      throw new BadRequestException('O espaço está inativo.');
    if (dto.participants > space.capacity)
      throw new BadRequestException(
        'O número de participantes excede a capacidade do espaço.',
      );
    if (
      dto.equipment.some((equipment) => !space.equipment.includes(equipment))
    ) {
      throw new BadRequestException(
        'Há equipamentos que não pertencem ao espaço.',
      );
    }
  }

  private async lockSpace(manager: EntityManager, id: number) {
    const space = await manager.findOne(Space, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!space) throw new NotFoundException('Espaço não encontrado.');
    return space;
  }

  private async assertAvailable(
    manager: EntityManager,
    dto: Pick<Reservation, 'spaceId' | 'date' | 'startTime' | 'endTime'>,
  ) {
    // Leitura com lock vê a aprovação mais recente mesmo em REPEATABLE READ.
    const conflict = await manager
      .createQueryBuilder(Reservation, 'reservation')
      .where('reservation.spaceId = :spaceId', { spaceId: dto.spaceId })
      .andWhere('reservation.date = :date', { date: dto.date })
      .andWhere('reservation.status = :status', {
        status: ReservationStatus.APPROVED,
      })
      .andWhere(
        'reservation.startTime < :endTime AND reservation.endTime > :startTime',
        { startTime: dto.startTime, endTime: dto.endTime },
      )
      .setLock('pessimistic_write')
      .getOne();
    if (conflict)
      throw new ConflictException(
        'O espaço já possui uma reserva aprovada neste horário.',
      );
  }
}
