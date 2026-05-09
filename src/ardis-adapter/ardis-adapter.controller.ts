import { Body, Controller, Post } from '@nestjs/common';
import { ArdisAdapterService } from './ardis-adapter.service';
import { GenerateXmlDto } from './dto/generate-xml.dto';

@Controller('ardis')
export class ArdisAdapterController {
  constructor(private readonly ardisAdapterService: ArdisAdapterService) {}

  @Post('generate-xml')
  generateXml(@Body() payload: GenerateXmlDto) {
    return this.ardisAdapterService.generateXml(payload);
  }
}
