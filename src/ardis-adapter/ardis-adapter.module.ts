import { Module } from '@nestjs/common';
import { ArdisAdapterController } from './ardis-adapter.controller';
import { ArdisAdapterService } from './ardis-adapter.service';
import { AzureFilesOutputService } from './azure-files-output.service';
import { BlobOutputService } from './blob-output.service';
import { FilesystemOutputService } from './filesystem-output.service';
import { OutputDeliveryService } from './output-delivery.service';
import { XmlGeneratorService } from './xml-generator.service';

@Module({
  controllers: [ArdisAdapterController],
  providers: [
    ArdisAdapterService,
    XmlGeneratorService,
    FilesystemOutputService,
    AzureFilesOutputService,
    BlobOutputService,
    OutputDeliveryService,
  ],
})
export class ArdisAdapterModule {}
