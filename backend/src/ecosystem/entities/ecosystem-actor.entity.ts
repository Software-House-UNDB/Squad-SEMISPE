import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EcosystemCategory {
  STARTUP = 'startup',
  COMPANY = 'company',
  UNIVERSITY = 'university',
  INSTITUTION = 'institution',
  INNOVATION_ENVIRONMENT = 'innovation_environment',
  INVESTOR = 'investor',
}

@Entity('ecosystem_actors')
@Index('IDX_ecosystem_actors_category_name', ['category', 'name'])
export class EcosystemActor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: EcosystemCategory })
  category: EcosystemCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  websiteUrl: string | null = null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  logoUrl: string | null = null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null = null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  city: string | null = null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string | null = null;

  @Column({ type: 'double', nullable: true })
  latitude: number | null = null;

  @Column({ type: 'double', nullable: true })
  longitude: number | null = null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
