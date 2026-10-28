import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
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

  @IsEnum(PartnerCategory)
  @IsOptional()
  category?: PartnerCategory;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @MaxLength(150)
  @IsNotEmpty()
  @IsString()
  shortDescription: string;
}
