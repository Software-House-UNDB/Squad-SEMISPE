import {
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ParseReservationPipe implements PipeTransform<
  unknown,
  Promise<CreateReservationDto>
> {
  private readonly validator = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  async transform(value: unknown): Promise<CreateReservationDto> {
    let data: unknown;
    try {
      if (typeof value !== 'string') throw new Error();
      data = JSON.parse(value) as unknown;
    } catch {
      throw new BadRequestException(
        'O campo dados deve conter um objeto JSON válido.',
      );
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException(
        'O campo dados deve conter um objeto JSON válido.',
      );
    }
    return this.validator.transform(data, {
      type: 'body',
      metatype: CreateReservationDto,
    }) as Promise<CreateReservationDto>;
  }
}
