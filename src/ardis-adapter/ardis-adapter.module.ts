import { Module } from '@nestjs/common';
import { ArdisAdapterController } from './ardis-adapter.controller';
import { ArdisAdapterService } from './ardis-adapter.service';
import { FileStorageService } from './file-storage.service';
import { XmlGeneratorService } from './xml-generator.service';

@Module({
  controllers: [ArdisAdapterController],
  providers: [ArdisAdapterService, XmlGeneratorService, FileStorageService],
})
export class ArdisAdapterModule {}
