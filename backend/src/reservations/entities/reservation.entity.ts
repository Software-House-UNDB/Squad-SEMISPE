import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Space } from '../../spaces/entities/space.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum RequesterType {
  PERSON = 'pessoa-fisica',
  INSTITUTION = 'instituicao',
}

export interface ReservationRequester {
  name: string;
  email: string;
  phone: string;
  type: RequesterType;
  institution: string | null;
  document: string;
}

@Entity('reservations')
@Index('IDX_reservations_schedule', ['spaceId', 'date', 'status', 'startTime'])
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  spaceId: number;

  @ManyToOne(() => Space, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'spaceId',
    foreignKeyConstraintName: 'FK_reservations_space',
  })
  space: Space;

  @Column({ type: 'json' })
  requester: ReservationRequester;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'int' })
  participants: number;

  @Column({ length: 150 })
  eventType: string;

  @Column({ type: 'json' })
  equipment: string[];

  @Column({ default: false })
  needsItSupport: boolean;

  @Column({ type: 'text' })
  subject: string;

  @Column()
  consent: boolean;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;

  @Column({ type: 'int', nullable: true })
  reviewedBy: number | null;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
