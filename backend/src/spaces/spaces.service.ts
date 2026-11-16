import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { Space } from './entities/space.entity';
import {
  Reservation,
  ReservationStatus,
} from '../reservations/entities/reservation.entity';

@Injectable()
export class SpacesService {
  constructor(
    @InjectRepository(Space)
    private readonly spacesRepository: Repository<Space>,
  ) {}

  create(dto: CreateSpaceDto): Promise<Space> {
    const space = this.spacesRepository.create(dto);
    return this.spacesRepository.save(space);
  }

  findAll(): Promise<Space[]> {
    return this.spacesRepository.find();
  }

  async findOne(id: number): Promise<Space> {
    const space = await this.spacesRepository.findOneBy({ id });
    if (!space) {
      throw new NotFoundException(`Espaço com id ${id} não encontrado.`);
    }
    return space;
  }

  async update(id: number, dto: UpdateSpaceDto): Promise<Space> {
    return this.spacesRepository.manager.transaction(async (manager) => {
      // Mesma ordem dos locks de criação/aprovação: primeiro o espaço.
      const space = await manager.findOne(Space, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!space)
        throw new NotFoundException(`Espaço com id ${id} não encontrado.`);
      Object.assign(
        space,
        Object.fromEntries(
          Object.entries(dto).filter(([, value]) => value !== undefined),
        ),
      );
      if (dto.capacity !== undefined || dto.equipment !== undefined) {
        const localNow = new Date(
          Date.now() - 3 * 60 * 60 * 1000,
        ).toISOString();
        const reservations = await manager
          .createQueryBuilder(Reservation, 'reservation')
          .where('reservation.spaceId = :spaceId', { spaceId: id })
          .andWhere('reservation.status = :status', {
            status: ReservationStatus.APPROVED,
          })
          .andWhere(
            '(reservation.date > :today OR (reservation.date = :today AND reservation.endTime > :time))',
            { today: localNow.slice(0, 10), time: localNow.slice(11, 19) },
          )
          .setLock('pessimistic_write')
          .getMany();
        if (
          reservations.some(
            (reservation) =>
              reservation.participants > space.capacity ||
              reservation.equipment.some(
                (equipment) => !space.equipment.includes(equipment),
              ),
          )
        ) {
          throw new ConflictException(
            'A alteração é incompatível com reservas aprovadas futuras ou em andamento. Reavalie ou cancele essas reservas antes de alterar o espaço.',
          );
        }
      }
      return manager.save(Space, space);
    });
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.spacesRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Espaço com id ${id} não encontrado.`);
      }
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code ===
          'ER_ROW_IS_REFERENCED_2'
      ) {
        throw new ConflictException(
          'O espaço possui reservas e não pode ser excluído. Desative-o para impedir novas solicitações.',
        );
      }
      throw error;
    }
  }
}
