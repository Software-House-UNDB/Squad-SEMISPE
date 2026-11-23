import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RequesterType } from '../entities/reservation.entity';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ReservationRequesterDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Matches(/^\d{10,11}$/)
  phone: string;

  @IsEnum(RequesterType)
  type: RequesterType;

  @ValidateIf(
    (dto: ReservationRequesterDto) =>
      dto.type === RequesterType.INSTITUTION || dto.institution != null,
  )
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  institution: string | null = null;

  @IsString()
  @Matches(/^\d{11}$|^\d{14}$/)
  document: string;
}

export class CreateReservationDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ReservationRequesterDto)
  requester: ReservationRequesterDto;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  spaceId: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  participants: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  eventType: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(150, { each: true })
  equipment: string[];

  @IsBoolean()
  needsItSupport: boolean;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  subject: string;

  @Equals(true, { message: 'O consentimento é obrigatório.' })
  consent: boolean;
}
