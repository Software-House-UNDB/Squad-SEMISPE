import { PartialType } from '@nestjs/mapped-types';
import { CreateEcosystemActorDto } from './create-ecosystem-actor.dto';

// Omitir preserva o valor; null limpa apenas campos opcionais.
export class UpdateEcosystemActorDto extends PartialType(
  CreateEcosystemActorDto,
  { skipNullProperties: false },
) {}
