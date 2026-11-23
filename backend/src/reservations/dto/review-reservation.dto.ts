import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class ReviewReservationDto {
  @IsIn([
    ReservationStatus.APPROVED,
    ReservationStatus.REJECTED,
    ReservationStatus.CANCELLED,
  ])
  status: ReservationStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2000)
  reviewNote?: string;
}
