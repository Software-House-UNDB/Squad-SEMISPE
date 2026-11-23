import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reservation } from './reservation.entity';

export enum AttachmentKind {
  LETTER = 'oficio',
  PROJECT = 'projeto',
  PRESENTATION = 'apresentacao',
  AGENDA = 'pauta',
}

@Entity('reservation_attachments')
export class ReservationAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reservationId: number;

  @ManyToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'reservationId',
    foreignKeyConstraintName: 'FK_reservation_attachments_reservation',
  })
  reservation: Reservation;

  @Column({ type: 'enum', enum: AttachmentKind })
  kind: AttachmentKind;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'longblob', select: false })
  content: Buffer;
}
