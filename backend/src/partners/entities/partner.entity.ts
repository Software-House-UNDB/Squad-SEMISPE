import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PartnerCategory {
  COMPANY = 'company',
  STARTUP = 'startup',
  EDUCATIONAL_INSTITUTION = 'educational_institution',
  GOVERNMENT = 'government',
  SUPPORT_ENTITY = 'support_entity',
  OTHER = 'other',
}

@Entity('partners')
export class Partner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: PartnerCategory,
    default: PartnerCategory.OTHER,
  })
  category: PartnerCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  logoUrl: string | null;

  @Column({ length: 150 })
  shortDescription: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
