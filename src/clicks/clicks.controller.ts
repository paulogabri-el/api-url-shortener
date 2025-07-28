import { Controller, Get, Param } from '@nestjs/common';
import { ClicksService } from './clicks.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Análise URLs')
@ApiBearerAuth()
@Controller('clicks')
export class ClicksController {
  constructor(private readonly clicksService: ClicksService) {}

  @Get(':shortCode/count')
  getClickCount(@Param('shortCode') shortCode: string) {
    return this.clicksService.getClickCount(shortCode);
  }
}
