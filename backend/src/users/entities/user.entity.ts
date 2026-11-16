import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
@Unique('UQ_users_email', ['email'])
@Unique('UQ_users_cpf', ['cpf'])
@Unique('UQ_users_cnpj', ['cnpj'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  institution: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  cpf: string | null;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cnpj: string | null;

  @Column()
  email: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  phone: string | null;

  @Exclude()
  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Exclude()
  @Column({ type: 'int', default: 0 })
  tokenVersion: number = 0;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
