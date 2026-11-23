import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { News, NewsCategory, NewsStatus } from './entities/news.entity';
import { NewsService } from './news.service';

describe('NewsService', () => {
  const payload = {
    title: 'Inovação em São Luís',
    summary: 'Resumo',
    content: 'Texto completo.',
    category: NewsCategory.INNOVATION,
  };
  const qb = {
    select: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };
  const manager = {
    transaction: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager,
  };
  let news: News;
  let service: NewsService;
  beforeEach(() => {
    jest.resetAllMocks();
    news = Object.assign(new News(), payload, {
      id: 1,
      slug: 'slug-estavel',
      status: NewsStatus.DRAFT,
      publishedAt: null,
    });
    repository.create.mockImplementation((data: object) => data);
    repository.save.mockImplementation((data: object) =>
      Promise.resolve({ id: 1, ...data }),
    );
    repository.findOneBy.mockResolvedValue(news);
    repository.delete.mockResolvedValue({ affected: 1 });
    manager.findOne.mockResolvedValue(news);
    manager.save.mockImplementation((_type: unknown, data: News) =>
      Promise.resolve(data),
    );
    manager.transaction.mockImplementation(
      (fn: (em: EntityManager) => unknown) =>
        fn(manager as unknown as EntityManager),
    );
    Object.values(qb).forEach((fn) => fn.mockReturnValue(qb));
    qb.getManyAndCount.mockResolvedValue([[news], 1]);
    repository.createQueryBuilder.mockReturnValue(qb);
    service = new NewsService(repository as unknown as Repository<News>);
  });

  it('gera slug ASCII e cria rascunho sem data de publicação', async () => {
    const result = await service.create(payload);
    expect(result).toMatchObject({ status: 'draft', publishedAt: null });
    expect(result.slug).toMatch(/^inovacao-em-sao-luis-[a-f0-9-]{36}$/);
  });
  it('limita o slug gerado e usa fallback para títulos sem caracteres latinos', async () => {
    expect(
      (await service.create({ ...payload, title: 'a'.repeat(200) })).slug
        .length,
    ).toBeLessThanOrEqual(200);
    expect((await service.create({ ...payload, title: '🚀' })).slug).toMatch(
      /^noticia-/,
    );
  });
  it('permite slug personalizado', async () => {
    expect(
      (await service.create({ ...payload, slug: 'noticia-do-parque' })).slug,
    ).toBe('noticia-do-parque');
  });
  it('mantém slug e campos omitidos na edição', async () => {
    await expect(
      service.update(1, {
        title: 'Título novo',
        slug: undefined,
        summary: undefined,
      }),
    ).resolves.toMatchObject({
      title: 'Título novo',
      slug: 'slug-estavel',
      summary: 'Resumo',
    });
    expect(manager.findOne).toHaveBeenCalledWith(News, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
  });
  it('publica com data do servidor e não a altera em nova tentativa', async () => {
    const first = await service.setPublication(1, true);
    expect(first.status).toBe(NewsStatus.PUBLISHED);
    expect(first.publishedAt).toBeInstanceOf(Date);
    const time = first.publishedAt!.getTime();
    expect((await service.setPublication(1, true)).publishedAt!.getTime()).toBe(
      time,
    );
  });
  it('retira de publicação e permite nova data ao republicar', async () => {
    news.status = NewsStatus.PUBLISHED;
    news.publishedAt = new Date('2020-01-01');
    await expect(service.setPublication(1, false)).resolves.toMatchObject({
      status: 'draft',
      publishedAt: null,
    });
    expect(
      (await service.setPublication(1, true)).publishedAt!.getUTCFullYear(),
    ).toBeGreaterThan(2020);
  });
  it('protege consultas públicas por id e slug com filtro publicado', async () => {
    await service.findPublicById(1);
    await service.findPublicBySlug('slug-estavel');
    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: 1,
      status: NewsStatus.PUBLISHED,
    });
    expect(repository.findOneBy).toHaveBeenCalledWith({
      slug: 'slug-estavel',
      status: NewsStatus.PUBLISHED,
    });
  });
  it('lista apenas publicadas, omite conteúdo e escapa curingas da busca', async () => {
    await service.findPublic({
      page: 2,
      limit: 5,
      search: '100%_=',
      category: NewsCategory.NOTICES,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('news.status = :status', {
      status: 'published',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(expect.any(String), {
      search: '%100=%=_==%',
    });
    expect(qb.select).not.toHaveBeenCalledWith(
      expect.arrayContaining(['news.content']),
    );
    expect(qb.orderBy).toHaveBeenCalledWith('news.publishedAt', 'DESC');
    expect(qb.skip).toHaveBeenCalledWith(5);
  });
  it('permite listar e consultar rascunhos na administração', async () => {
    await service.findAdmin({ page: 1, limit: 20, status: NewsStatus.DRAFT });
    await service.findAdminById(1);
    expect(qb.andWhere).toHaveBeenCalledWith('news.status = :status', {
      status: 'draft',
    });
    expect(qb.orderBy).toHaveBeenCalledWith('news.createdAt', 'DESC');
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });
  it('traduz duplicação concorrente de slug em 409 na criação e edição', async () => {
    const error = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error(), { code: 'ER_DUP_ENTRY' }),
    );
    repository.save.mockRejectedValue(error);
    manager.save.mockRejectedValue(error);
    await expect(service.create(payload)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(
      service.update(1, { slug: 'duplicado' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('propaga outros erros de persistência', async () => {
    repository.save.mockRejectedValue(new Error('DB offline'));
    await expect(service.create(payload)).rejects.toThrow('DB offline');
  });
  it('retorna 404 para inexistentes e rascunhos nas consultas públicas', async () => {
    repository.findOneBy.mockResolvedValue(null);
    manager.findOne.mockResolvedValue(null);
    repository.delete.mockResolvedValue({ affected: 0 });
    await expect(service.findPublicById(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findPublicBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findAdminById(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.update(99, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.setPublication(99, true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
