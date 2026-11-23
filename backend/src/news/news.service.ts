import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryAdminNewsDto, QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { News, NewsCategory, NewsStatus } from './entities/news.entity';

export const NEWS_CATEGORIES = [
  { value: NewsCategory.INNOVATION, label: 'Inovação' },
  { value: NewsCategory.STARTUPS, label: 'Startups' },
  { value: NewsCategory.TECHNOLOGY_PARK, label: 'Parque Tecnológico' },
  { value: NewsCategory.ECOSYSTEM, label: 'Ecossistema' },
  { value: NewsCategory.NOTICES, label: 'Editais' },
];

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News) private readonly news: Repository<News>,
  ) {}

  async create(dto: CreateNewsDto) {
    const base =
      dto.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 160)
        .replace(/-$/, '') || 'noticia';
    try {
      return await this.news.save(
        this.news.create({
          ...dto,
          slug: dto.slug ?? `${base}-${randomUUID()}`,
          status: NewsStatus.DRAFT,
          publishedAt: null,
        }),
      );
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  findPublic(query: QueryNewsDto) {
    return this.list(query, NewsStatus.PUBLISHED);
  }

  findAdmin(query: QueryAdminNewsDto) {
    return this.list(query, query.status, true);
  }

  async findPublicById(id: number) {
    const news = await this.news.findOneBy({
      id,
      status: NewsStatus.PUBLISHED,
    });
    if (!news) throw new NotFoundException('Notícia não encontrada.');
    return news;
  }

  async findPublicBySlug(slug: string) {
    const news = await this.news.findOneBy({
      slug,
      status: NewsStatus.PUBLISHED,
    });
    if (!news) throw new NotFoundException('Notícia não encontrada.');
    return news;
  }

  async findAdminById(id: number) {
    const news = await this.news.findOneBy({ id });
    if (!news) throw new NotFoundException('Notícia não encontrada.');
    return news;
  }

  async update(id: number, dto: UpdateNewsDto) {
    try {
      return await this.news.manager.transaction(async (manager) => {
        const news = await this.lock(manager, id);
        Object.assign(
          news,
          Object.fromEntries(
            Object.entries(dto).filter(([, value]) => value !== undefined),
          ),
        );
        return manager.save(News, news);
      });
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  setPublication(id: number, published: boolean) {
    return this.news.manager.transaction(async (manager) => {
      const news = await this.lock(manager, id);
      if (published) {
        if (news.status !== NewsStatus.PUBLISHED) news.publishedAt = new Date();
        news.status = NewsStatus.PUBLISHED;
      } else {
        news.status = NewsStatus.DRAFT;
        news.publishedAt = null;
      }
      return manager.save(News, news);
    });
  }

  async remove(id: number) {
    const result = await this.news.delete(id);
    if (!result.affected)
      throw new NotFoundException('Notícia não encontrada.');
  }

  private async list(query: QueryNewsDto, status?: NewsStatus, admin = false) {
    const builder = this.news
      .createQueryBuilder('news')
      .select([
        'news.id',
        'news.title',
        'news.slug',
        'news.summary',
        'news.category',
        'news.imageUrl',
        'news.imageAlt',
        'news.status',
        'news.publishedAt',
        'news.createdAt',
        'news.updatedAt',
      ]);
    if (status) builder.andWhere('news.status = :status', { status });
    if (query.category)
      builder.andWhere('news.category = :category', {
        category: query.category,
      });
    if (query.search)
      builder.andWhere(
        "(news.title LIKE :search ESCAPE '=' OR news.summary LIKE :search ESCAPE '=')",
        { search: `%${query.search.replace(/[=%_]/g, '=$&')}%` },
      );
    const [items, total] = await builder
      .orderBy(admin ? 'news.createdAt' : 'news.publishedAt', 'DESC')
      .addOrderBy('news.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return { items, total, page: query.page, limit: query.limit };
  }

  private async lock(manager: EntityManager, id: number) {
    const news = await manager.findOne(News, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!news) throw new NotFoundException('Notícia não encontrada.');
    return news;
  }

  private handleWriteError(error: unknown): never {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
    ) {
      throw new ConflictException(
        'Este endereço amigável já está em uso por outra notícia.',
      );
    }
    throw error;
  }
}
