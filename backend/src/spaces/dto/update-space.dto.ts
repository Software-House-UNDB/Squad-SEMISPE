import { PartialType } from '@nestjs/mapped-types';
import { CreateSpaceDto } from './create-space.dto';

// Campos omitidos são opcionais; null ainda passa pelas regras de validação.
export class UpdateSpaceDto extends PartialType(CreateSpaceDto, {
  skipNullProperties: false,
}) {}
