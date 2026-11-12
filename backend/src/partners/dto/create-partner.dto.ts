import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PartnerCategory } from '../entities/partner.entity';
import { Transform } from 'class-transformer';

const trimText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePartnerDto {
  @Transform(trimText)
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  name: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsEnum(PartnerCategory)
  category?: PartnerCategory;

  @MaxLength(255)
  @IsUrl()
  @IsOptional()
  @Transform(trimText)
  logoUrl?: string | null;

  @Transform(trimText)
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  description: string;

  @MaxLength(150)
  @Transform(trimText)
  @IsNotEmpty()
  @IsString()
  shortDescription: string;
}
