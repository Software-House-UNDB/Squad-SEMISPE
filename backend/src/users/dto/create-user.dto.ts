import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

function onlyDigits({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.replace(/\D/g, '') : value;
}

function normalizeEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  institution?: string;

  @IsOptional()
  @Transform(onlyDigits)
  @Matches(/^\d{11}$/, {
    message: 'cpf deve conter exatamente 11 dígitos numéricos',
  })
  cpf?: string;

  @IsOptional()
  @Transform(onlyDigits)
  @Matches(/^\d{14}$/, {
    message: 'cnpj deve conter exatamente 14 dígitos numéricos',
  })
  cnpj?: string;

  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @IsOptional()
  @Transform(onlyDigits)
  @Matches(/^\d{10,11}$/, {
    message: 'phone deve conter 10 ou 11 dígitos numéricos',
  })
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;
}
