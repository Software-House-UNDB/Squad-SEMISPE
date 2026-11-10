import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { Role } from '../users/entities/user.entity';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { Idea, IdeaCategory, IdeaStatus } from './entities/idea.entity';

export interface IdeaFilters {
  category?: IdeaCategory;
  status?: IdeaStatus;
}

// Dados do proponente devolvidos junto da ideia: nunca senha, CPF, CNPJ ou role.
const SELECT_WITH_AUTHOR: FindOptionsSelect<Idea> = {
  id: true,
  title: true,
  category: true,
  problem: true,
  solution: true,
  expectedBenefits: true,
  targetAudience: true,
  applicationArea: true,
  status: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: { id: true, name: true, institution: true, email: true, phone: true },
};

const LOCKED_MESSAGE =
  'A ideia já está em avaliação e não pode mais ser alterada.';

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(Idea)
    private readonly ideasRepository: Repository<Idea>,
  ) {}

  async create(dto: CreateIdeaDto, authorId: number): Promise<Idea> {
    const idea = this.ideasRepository.create({ ...dto, authorId });
    const saved = await this.ideasRepository.save(idea);
    return this.findWithAuthor(saved.id);
  }

  findAll(filters: IdeaFilters = {}): Promise<Idea[]> {
    return this.ideasRepository.find({
      // Filtros undefined são ignorados pelo TypeORM.
      where: { category: filters.category, status: filters.status },
      relations: { author: true },
      select: SELECT_WITH_AUTHOR,
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  findMine(authorId: number): Promise<Idea[]> {
    return this.ideasRepository.find({
      where: { authorId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number, user: AuthenticatedUser): Promise<Idea> {
    const idea = await this.findWithAuthor(id);
    if (user.role !== Role.ADMIN && idea.authorId !== user.userId) {
      throw new ForbiddenException('Você não tem acesso a esta ideia.');
    }
    return idea;
  }

  async update(
    id: number,
    dto: UpdateIdeaDto,
    user: AuthenticatedUser,
  ): Promise<Idea> {
    await this.ensureAuthorCanChange(id, user);

    if (Object.keys(dto).length > 0) {
      // O WHERE com status garante a regra mesmo se o admin mudar o status
      // entre a conferência acima e esta gravação.
      const result = await this.ideasRepository.update(
        { id, authorId: user.userId, status: IdeaStatus.SUBMITTED },
        dto,
      );
      if (result.affected === 0) {
        throw new ConflictException(LOCKED_MESSAGE);
      }
    }
    return this.findWithAuthor(id);
  }

  async updateStatus(id: number, status: IdeaStatus): Promise<Idea> {
    const result = await this.ideasRepository.update({ id }, { status });
    if (result.affected === 0) {
      throw this.notFound(id);
    }
    return this.findWithAuthor(id);
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    if (user.role === Role.ADMIN) {
      const result = await this.ideasRepository.delete({ id });
      if (result.affected === 0) {
        throw this.notFound(id);
      }
      return;
    }

    await this.ensureAuthorCanChange(id, user);
    const result = await this.ideasRepository.delete({
      id,
      authorId: user.userId,
      status: IdeaStatus.SUBMITTED,
    });
    if (result.affected === 0) {
      throw new ConflictException(LOCKED_MESSAGE);
    }
  }

  private async findWithAuthor(id: number): Promise<Idea> {
    const idea = await this.ideasRepository.findOne({
      where: { id },
      relations: { author: true },
      select: SELECT_WITH_AUTHOR,
    });
    if (!idea) {
      throw this.notFound(id);
    }
    return idea;
  }

  // Só o autor altera o conteúdo, e só enquanto a ideia está "submitted".
  private async ensureAuthorCanChange(
    id: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    const idea = await this.ideasRepository.findOneBy({ id });
    if (!idea) {
      throw this.notFound(id);
    }
    if (idea.authorId !== user.userId) {
      throw new ForbiddenException(
        'Somente o autor pode alterar o conteúdo desta ideia.',
      );
    }
    if (idea.status !== IdeaStatus.SUBMITTED) {
      throw new ConflictException(LOCKED_MESSAGE);
    }
  }

  private notFound(id: number): NotFoundException {
    return new NotFoundException(`Ideia com id ${id} não encontrada.`);
  }
}
