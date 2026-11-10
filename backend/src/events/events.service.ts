import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventRegistration } from './entities/event-registration.entity';
import { Event, EventType } from './entities/event.entity';

export type EventPeriod = 'upcoming' | 'past';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(EventRegistration)
    private readonly registrationsRepository: Repository<EventRegistration>,
  ) {}

  findAll(type?: EventType, period?: EventPeriod): Promise<Event[]> {
    const where: FindOptionsWhere<Event> = {};
    if (type) where.type = type;
    if (period === 'upcoming') where.startsAt = MoreThanOrEqual(new Date());
    if (period === 'past') where.startsAt = LessThan(new Date());
    return this.eventsRepository.find({
      where,
      order: { startsAt: period === 'past' ? 'DESC' : 'ASC' },
    });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventsRepository.findOneBy({ id });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  async create(dto: CreateEventDto): Promise<Event> {
    this.assertValidRange(dto.startsAt, dto.endsAt);
    const event = this.eventsRepository.create(dto);
    return this.eventsRepository.save(event);
  }

  async update(id: number, dto: UpdateEventDto): Promise<Event> {
    const event = await this.eventsRepository.preload({ id, ...dto });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    this.assertValidRange(event.startsAt, event.endsAt);
    return this.eventsRepository.save(event);
  }

  async remove(id: number): Promise<void> {
    const result = await this.eventsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
  }

  async register(
    eventId: number,
    dto: CreateRegistrationDto,
  ): Promise<EventRegistration> {
    await this.findOne(eventId);
    const existing = await this.registrationsRepository.findOneBy({
      eventId,
      email: dto.email,
    });
    if (existing) {
      throw new ConflictException(
        `Email ${dto.email} already registered for this event`,
      );
    }
    const registration = this.registrationsRepository.create({
      ...dto,
      eventId,
    });
    return this.registrationsRepository.save(registration);
  }

  async findRegistrations(eventId: number): Promise<EventRegistration[]> {
    await this.findOne(eventId);
    return this.registrationsRepository.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });
  }

  private assertValidRange(startsAt: Date, endsAt?: Date | null): void {
    if (endsAt && endsAt < startsAt) {
      throw new BadRequestException('endsAt must not be before startsAt');
    }
  }
}
