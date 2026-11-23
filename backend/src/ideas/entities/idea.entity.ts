import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum IdeaCategory {
  HEALTH = 'health',
  EDUCATION = 'education',
  MOBILITY = 'mobility',
  ENVIRONMENT = 'environment',
  TOURISM = 'tourism',
  CULTURE = 'culture',
  SECURITY = 'security',
  TECHNOLOGY = 'technology',
  SMART_CITY = 'smart_city',
  DIGITAL_GOVERNMENT = 'digital_government',
  OTHER = 'other',
}

// Fluxo do documento de requisitos (seção 3.8).
export enum IdeaStatus {
  SUBMITTED = 'submitted',
  EVALUATION = 'evaluation',
  UNDER_ANALYSIS = 'under_analysis',
  APPROVED = 'approved',
  FORWARDED = 'forwarded',
  IMPLEMENTED = 'implemented',
}

@Entity('ideas')
export class Idea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'enum', enum: IdeaCategory })
  category: IdeaCategory;

  @Column({ type: 'text' })
  problem: string;

  @Column({ type: 'text' })
  solution: string;

  @Column({ type: 'text' })
  expectedBenefits: string;

  @Column({ length: 255 })
  targetAudience: string;

  @Column({ length: 255 })
  applicationArea: string;

  @Column({ type: 'enum', enum: IdeaStatus, default: IdeaStatus.SUBMITTED })
  status: IdeaStatus = IdeaStatus.SUBMITTED;

  @Column()
  authorId: number;

  // Os dados do proponente (nome, instituição, e-mail, telefone) vêm da conta.
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'authorId',
    foreignKeyConstraintName: 'FK_e4ef6f47b5b94dff28757a88f37',
  })
  author?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
