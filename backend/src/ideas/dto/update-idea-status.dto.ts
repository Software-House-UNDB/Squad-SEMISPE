import { IsEnum } from 'class-validator';
import { IdeaStatus } from '../entities/idea.entity';

export class UpdateIdeaStatusDto {
  @IsEnum(IdeaStatus, {
    message: `O status deve ser um dos seguintes: ${Object.values(IdeaStatus).join(', ')}.`,
  })
  status: IdeaStatus;
}
