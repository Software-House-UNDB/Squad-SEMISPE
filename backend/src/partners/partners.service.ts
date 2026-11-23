import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Partner, PartnerCategory } from './entities/partner.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnersRepository: Repository<Partner>,
  ) {}

  findAll(category?: PartnerCategory): Promise<Partner[]> {
    return this.partnersRepository.find({ where: { category } });
  }

  async findOne(id: number): Promise<Partner> {
    const partner = await this.partnersRepository.findOneBy({ id });
    if (!partner) {
      throw new NotFoundException(`Partner with id ${id} not found`);
    }
    return partner;
  }

  async create(dto: CreatePartnerDto): Promise<Partner> {
    const existing = await this.partnersRepository.findOneBy({
      email: dto.email,
    });
    if (existing) {
      throw new ConflictException(`Email ${dto.email} already registered`);
    }
    const partner = this.partnersRepository.create(dto);
    return this.save(partner);
  }

  async update(id: number, dto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.partnersRepository.preload({ id, ...dto });
    if (!partner) {
      throw new NotFoundException(`Partner with id ${id} not found`);
    }
    if (dto.email) {
      const existing = await this.partnersRepository.findOneBy({
        email: dto.email,
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email ${dto.email} already registered`);
      }
    }
    return this.save(partner);
  }

  private async save(partner: Partner): Promise<Partner> {
    try {
      return await this.partnersRepository.save(partner);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code ===
          'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'Já existe um parceiro cadastrado com este e-mail.',
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.partnersRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Partner with id ${id} not found`);
    }
  }
}
