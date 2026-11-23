import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IdeaCategory } from '../entities/idea.entity';

function trimText({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

// Limite dos textos longos: cabe com folga numa coluna TEXT do MySQL.
const LONG_TEXT_MAX = 5000;

export class CreateIdeaDto {
  @Transform(trimText)
  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(150, { message: 'O título deve ter no máximo 150 caracteres.' })
  title: string;

  @IsEnum(IdeaCategory, {
    message: `A categoria deve ser uma das seguintes: ${Object.values(IdeaCategory).join(', ')}.`,
  })
  category: IdeaCategory;

  @Transform(trimText)
  @IsString({ message: 'O problema identificado deve ser um texto.' })
  @IsNotEmpty({ message: 'O problema identificado é obrigatório.' })
  @MaxLength(LONG_TEXT_MAX, {
    message: `O problema identificado deve ter no máximo ${LONG_TEXT_MAX} caracteres.`,
  })
  problem: string;

  @Transform(trimText)
  @IsString({ message: 'A solução proposta deve ser um texto.' })
  @IsNotEmpty({ message: 'A solução proposta é obrigatória.' })
  @MaxLength(LONG_TEXT_MAX, {
    message: `A solução proposta deve ter no máximo ${LONG_TEXT_MAX} caracteres.`,
  })
  solution: string;

  @Transform(trimText)
  @IsString({ message: 'Os benefícios esperados devem ser um texto.' })
  @IsNotEmpty({ message: 'Os benefícios esperados são obrigatórios.' })
  @MaxLength(LONG_TEXT_MAX, {
    message: `Os benefícios esperados devem ter no máximo ${LONG_TEXT_MAX} caracteres.`,
  })
  expectedBenefits: string;

  @Transform(trimText)
  @IsString({ message: 'O público-alvo deve ser um texto.' })
  @IsNotEmpty({ message: 'O público-alvo é obrigatório.' })
  @MaxLength(255, {
    message: 'O público-alvo deve ter no máximo 255 caracteres.',
  })
  targetAudience: string;

  @Transform(trimText)
  @IsString({ message: 'A área de aplicação deve ser um texto.' })
  @IsNotEmpty({ message: 'A área de aplicação é obrigatória.' })
  @MaxLength(255, {
    message: 'A área de aplicação deve ter no máximo 255 caracteres.',
  })
  applicationArea: string;
}
