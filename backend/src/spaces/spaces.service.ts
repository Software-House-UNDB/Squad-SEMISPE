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
    const space = await this.spacesRepository.preload({ ...dto, id });
    if (!space) {
      throw new NotFoundException(`Espaço com id ${id} não encontrado.`);
    }
    return this.spacesRepository.save(space);
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
