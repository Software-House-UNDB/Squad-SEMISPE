import { Transform } from 'class-transformer';
import { SpaceState } from '../entities/space.entity';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

function trimText({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimList({ value }: { value: unknown }): unknown {
  return Array.isArray(value)
    ? value.map((item: unknown) =>
        typeof item === 'string' ? item.trim() : item,
      )
    : value;
}

export class CreateSpaceDto {
  @Transform(trimText)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(150, {
    message: 'O nome deve ter no máximo 150 caracteres.',
  })
  name: string;

  @IsOptional()
  @Transform(trimText)
  @IsString({ message: 'A descrição deve ser um texto.' })
  description?: string | null;

  @IsInt({ message: 'A capacidade deve ser um número inteiro.' })
  @Min(1, { message: 'A capacidade deve ser maior que zero.' })
  // Limite da coluna INT no MySQL.
  @Max(2_147_483_647, {
    message: 'A capacidade excede o limite permitido.',
  })
  capacity: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Transform(trimList)
  @IsArray({ message: 'As fotos devem ser uma lista de URLs.' })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    {
      each: true,
      message: 'Cada foto deve ser uma URL HTTP ou HTTPS válida.',
    },
  )
  photoUrls?: string[];

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Transform(trimList)
  @IsArray({ message: 'Os equipamentos devem ser uma lista.' })
  @IsString({ each: true, message: 'Cada equipamento deve ser um texto.' })
  @IsNotEmpty({
    each: true,
    message: 'O nome de cada equipamento não pode ficar vazio.',
  })
  equipment?: string[];

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsEnum(SpaceState, {
    message: 'O status deve ser ativo ou inativo.',
  })
  state?: SpaceState;
}
