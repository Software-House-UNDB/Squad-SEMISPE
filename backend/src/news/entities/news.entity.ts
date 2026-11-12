import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NewsCategory {
  INNOVATION = 'innovation',
  STARTUPS = 'startups',
  TECHNOLOGY_PARK = 'technology_park',
  ECOSYSTEM = 'ecosystem',
  NOTICES = 'notices',
}

export enum NewsStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('news')
@Index('UQ_news_slug', ['slug'], { unique: true })
@Index('IDX_news_publication', ['status', 'publishedAt', 'id'])
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 200 })
  slug: string;

  @Column({ length: 500 })
  summary: string;

  @Column({ type: 'mediumtext' })
  content: string;

  @Column({ type: 'enum', enum: NewsCategory })
  category: NewsCategory;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  imageUrl: string | null = null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  imageAlt: string | null = null;

  @Column({ type: 'enum', enum: NewsStatus, default: NewsStatus.DRAFT })
  status: NewsStatus;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
