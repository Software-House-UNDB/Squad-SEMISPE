import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
