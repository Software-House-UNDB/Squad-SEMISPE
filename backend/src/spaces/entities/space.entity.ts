import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SpaceState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('spaces')
export class Space {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'json' })
  photoUrls: string[] = [];

  @Column({ type: 'json' })
  equipment: string[] = [];

  @Column({ type: 'enum', enum: SpaceState, default: SpaceState.ACTIVE })
  state: SpaceState = SpaceState.ACTIVE;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
