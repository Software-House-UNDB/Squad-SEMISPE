import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePartnerDto {
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

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
