import { Controller, Get } from '@nestjs/common';
import { Station } from './interfaces/station.interface';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  findAll(): Promise<Station[]> {
    return this.stationsService.findAll();
  }
}
