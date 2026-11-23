import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { EcosystemCategory } from '../entities/ecosystem-actor.entity';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
export class CreateEcosystemActorDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsEnum(EcosystemCategory)
  category: EcosystemCategory;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @Transform(trim)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    disallow_auth: true,
  })
  @MaxLength(2048)
  websiteUrl?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    disallow_auth: true,
  })
  @MaxLength(2048)
  logoUrl?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  city?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(
    /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/,
  )
  state?: string | null;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsLongitude()
  longitude?: number | null;
}
