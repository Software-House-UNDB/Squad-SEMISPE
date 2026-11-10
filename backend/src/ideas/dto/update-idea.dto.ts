import { PartialType } from '@nestjs/mapped-types';
import { CreateIdeaDto } from './create-idea.dto';

// Campos omitidos são opcionais; null ainda passa pelas regras de validação.
export class UpdateIdeaDto extends PartialType(CreateIdeaDto, {
  skipNullProperties: false,
}) {}
