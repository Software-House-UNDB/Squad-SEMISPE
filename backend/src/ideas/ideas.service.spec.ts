import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { Role } from '../users/entities/user.entity';
import { Idea, IdeaCategory, IdeaStatus } from './entities/idea.entity';
import { IdeasService } from './ideas.service';

describe('IdeasService (regras de dono e de status)', () => {
  const author: AuthenticatedUser = {
    userId: 2,
    email: 'autor@example.com',
    role: Role.USER,
  };
  const stranger: AuthenticatedUser = {
    userId: 3,
    email: 'outro@example.com',
    role: Role.USER,
  };
  const admin: AuthenticatedUser = {
    userId: 1,
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  let stored: Idea | null;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let service: IdeasService;

  const buildIdea = (status = IdeaStatus.SUBMITTED): Idea =>
    Object.assign(new Idea(), {
      id: 10,
      title: 'Ideia',
      category: IdeaCategory.OTHER,
      authorId: author.userId,
      status,
    });

  beforeEach(() => {
    stored = buildIdea();
    repository = {
      create: jest.fn((data: Partial<Idea>) => Object.assign(new Idea(), data)),
      save: jest.fn((idea: Idea) => Promise.resolve({ ...idea, id: 10 })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(() => Promise.resolve(stored)),
      findOneBy: jest.fn(() => Promise.resolve(stored)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    service = new IdeasService(repository as never);
  });

  it('grava o autor recebido e devolve a ideia com o proponente', async () => {
    const result = await service.create(
      {
        title: 'Ideia',
        category: IdeaCategory.OTHER,
        problem: 'p',
        solution: 's',
        expectedBenefits: 'b',
        targetAudience: 't',
        applicationArea: 'a',
      },
      author.userId,
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: author.userId }),
    );
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ relations: { author: true } }),
    );
    expect(result).toBe(stored);
  });

  it('nunca seleciona senha, CPF, CNPJ ou role do autor', async () => {
    await service.findAll();
    const [{ select }] = repository.find.mock.calls[0] as [
      { select: { author: Record<string, boolean> } },
    ];
    expect(Object.keys(select.author).sort()).toEqual(
      ['email', 'id', 'institution', 'name', 'phone'].sort(),
    );
  });

  describe('findOne', () => {
    it('permite ao autor e ao admin', async () => {
      await expect(service.findOne(10, author)).resolves.toBe(stored);
      await expect(service.findOne(10, admin)).resolves.toBe(stored);
    });

    it('retorna 403 para outro usuário', async () => {
      await expect(service.findOne(10, stranger)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('retorna 404 para ideia inexistente', async () => {
      stored = null;
      await expect(service.findOne(10, admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update (conteúdo)', () => {
    it('permite ao autor enquanto a ideia está submitted', async () => {
      await service.update(10, { title: 'Novo' }, author);
      expect(repository.update).toHaveBeenCalledWith(
        { id: 10, authorId: author.userId, status: IdeaStatus.SUBMITTED },
        { title: 'Novo' },
      );
    });

    it('retorna 409 depois que a avaliação começou', async () => {
      stored = buildIdea(IdeaStatus.EVALUATION);
      await expect(
        service.update(10, { title: 'Novo' }, author),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('retorna 409 se o status mudar durante a gravação', async () => {
      repository.update.mockResolvedValue({ affected: 0 });
      await expect(
        service.update(10, { title: 'Novo' }, author),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it.each([
      ['outro usuário', stranger],
      ['admin que não é o autor', admin],
    ])('retorna 403 para %s', async (_, user) => {
      await expect(
        service.update(10, { title: 'Novo' }, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('retorna 404 para ideia inexistente', async () => {
      stored = null;
      await expect(
        service.update(10, { title: 'Novo' }, author),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('não grava nada quando o corpo está vazio', async () => {
      await expect(service.update(10, {}, author)).resolves.toBe(stored);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('altera o status de qualquer ideia', async () => {
      stored = buildIdea(IdeaStatus.APPROVED);
      await expect(
        service.updateStatus(10, IdeaStatus.SUBMITTED),
      ).resolves.toBe(stored);
      expect(repository.update).toHaveBeenCalledWith(
        { id: 10 },
        { status: IdeaStatus.SUBMITTED },
      );
    });

    it('retorna 404 para ideia inexistente', async () => {
      repository.update.mockResolvedValue({ affected: 0 });
      await expect(
        service.updateStatus(10, IdeaStatus.APPROVED),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('permite ao autor enquanto a ideia está submitted', async () => {
      await service.remove(10, author);
      expect(repository.delete).toHaveBeenCalledWith({
        id: 10,
        authorId: author.userId,
        status: IdeaStatus.SUBMITTED,
      });
    });

    it('retorna 409 para o autor depois que a avaliação começou', async () => {
      stored = buildIdea(IdeaStatus.UNDER_ANALYSIS);
      await expect(service.remove(10, author)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('retorna 403 para outro usuário', async () => {
      await expect(service.remove(10, stranger)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('permite ao admin em qualquer status', async () => {
      stored = buildIdea(IdeaStatus.IMPLEMENTED);
      await service.remove(10, admin);
      expect(repository.delete).toHaveBeenCalledWith({ id: 10 });
      expect(repository.findOneBy).not.toHaveBeenCalled();
    });

    it('retorna 404 ao admin para ideia inexistente', async () => {
      repository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(10, admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
