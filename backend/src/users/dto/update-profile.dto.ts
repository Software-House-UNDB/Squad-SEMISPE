import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/** Dados editáveis pelo titular. Identificação, senha e papel ficam fora do contrato. */
export class UpdateProfileDto extends PartialType(
  PickType(CreateUserDto, ['email', 'phone', 'institution', 'cnpj'] as const),
  { skipNullProperties: false },
) {}
