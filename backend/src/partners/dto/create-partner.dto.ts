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

export class CreatePartnerDto {
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  name: string;

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
  logoUrl?: string | null;

  @IsNotEmpty()
  @IsString()
  description: string;

  @MaxLength(150)
  @IsNotEmpty()
  @IsString()
  shortDescription: string;
}
