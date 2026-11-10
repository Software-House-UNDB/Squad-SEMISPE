import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateContactDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(150)
  @Matches(/^[^\r\n]+$/, { message: 'O nome deve estar em uma única linha.' })
  name: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'O assunto é obrigatório.' })
  @MaxLength(150)
  @Matches(/^[^\r\n]+$/, {
    message: 'O assunto deve estar em uma única linha.',
  })
  subject: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'A mensagem é obrigatória.' })
  @MaxLength(5000)
  message: string;
}
