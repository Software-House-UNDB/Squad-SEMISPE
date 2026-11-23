import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContactStatus {
  NEW = 'new',
  READ = 'read',
  CLOSED = 'closed',
}

export enum ContactNotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('contacts')
@Index('IDX_contacts_created', ['createdAt', 'id'])
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 254 })
  email: string;

  @Column({ length: 150 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: ContactStatus, default: ContactStatus.NEW })
  status: ContactStatus;

  @Column({
    type: 'enum',
    enum: ContactNotificationStatus,
    default: ContactNotificationStatus.PENDING,
  })
  notificationStatus: ContactNotificationStatus;

  @Column({ type: 'int', default: 0 })
  notificationAttempts: number;

  @Column({ type: 'datetime', nullable: true })
  notifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
