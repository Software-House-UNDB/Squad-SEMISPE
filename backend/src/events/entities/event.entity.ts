import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventRegistration } from './event-registration.entity';

export enum EventType {
  HACKATHON = 'hackathon',
  WORKSHOP = 'workshop',
  COURSE = 'course',
  OTHER = 'other',
}

export interface EventScheduleItem {
  time: string;
  title: string;
  description?: string;
}

export interface EventSpeaker {
  name: string;
  bio?: string;
  photoUrl?: string;
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.OTHER,
  })
  type: EventType;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 255 })
  location: string;

  @Column({ type: 'datetime' })
  startsAt: Date;

  @Column({ type: 'datetime', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'json' })
  schedule: EventScheduleItem[] = [];

  @Column({ type: 'json' })
  speakers: EventSpeaker[] = [];

  @OneToMany(() => EventRegistration, (registration) => registration.event)
  registrations: EventRegistration[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
