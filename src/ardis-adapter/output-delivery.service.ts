import { Injectable } from '@nestjs/common';
import { AzureFilesOutputService } from './azure-files-output.service';
import { BlobOutputService } from './blob-output.service';
import { FilesystemOutputService } from './filesystem-output.service';
import { DeliveryResult, OutputMode } from './types/ardis.types';

@Injectable()
export class OutputDeliveryService {
  constructor(
    private readonly filesystemOutputService: FilesystemOutputService,
    private readonly azureFilesOutputService: AzureFilesOutputService,
    private readonly blobOutputService: BlobOutputService,
  ) {}

  async saveGeneratedXml(fileName: string, xml: string): Promise<DeliveryResult> {
    const mode = this.resolveMode();

    switch (mode) {
      case 'filesystem': {
        const primary = await this.filesystemOutputService.saveGeneratedXml(fileName, xml);
        return { primary, secondary: [] };
      }
      case 'blob': {
        const primary = await this.blobOutputService.saveGeneratedXml(fileName, xml);
        return { primary, secondary: [] };
      }
      case 'azure-files': {
        const primary = await this.azureFilesOutputService.saveGeneratedXml(fileName, xml);
        return { primary, secondary: [] };
      }
      case 'both': {
        const azureFilesResult = await this.azureFilesOutputService.saveGeneratedXml(
          fileName,
          xml,
        );
        const blobResult = await this.blobOutputService.saveGeneratedXml(fileName, xml);
        return { primary: azureFilesResult, secondary: [blobResult] };
      }
      case 'auto':
      default: {
        if (this.azureFilesOutputService.isConfigured()) {
          const primary = await this.azureFilesOutputService.saveGeneratedXml(fileName, xml);
          return { primary, secondary: [] };
        }

        if (this.blobOutputService.isConfigured()) {
          const primary = await this.blobOutputService.saveGeneratedXml(fileName, xml);
          return { primary, secondary: [] };
        }

        const primary = await this.filesystemOutputService.saveGeneratedXml(fileName, xml);
        return { primary, secondary: [] };
      }
    }
  }

  async saveLog(projectNumber: string, payload: unknown): Promise<DeliveryResult> {
    const mode = this.resolveMode();

    switch (mode) {
      case 'filesystem': {
        const primary = await this.filesystemOutputService.saveLog(projectNumber, payload);
        return { primary, secondary: [] };
      }
      case 'blob': {
        const primary = await this.blobOutputService.saveLog(projectNumber, payload);
        return { primary, secondary: [] };
      }
      case 'azure-files': {
        const primary = await this.azureFilesOutputService.saveLog(projectNumber, payload);
        return { primary, secondary: [] };
      }
      case 'both': {
        const azureFilesResult = await this.azureFilesOutputService.saveLog(
          projectNumber,
          payload,
        );
        const blobResult = await this.blobOutputService.saveLog(projectNumber, payload);
        return { primary: azureFilesResult, secondary: [blobResult] };
      }
      case 'auto':
      default: {
        if (this.azureFilesOutputService.isConfigured()) {
          const primary = await this.azureFilesOutputService.saveLog(projectNumber, payload);
          return { primary, secondary: [] };
        }

        if (this.blobOutputService.isConfigured()) {
          const primary = await this.blobOutputService.saveLog(projectNumber, payload);
          return { primary, secondary: [] };
        }

        const primary = await this.filesystemOutputService.saveLog(projectNumber, payload);
        return { primary, secondary: [] };
      }
    }
  }

  private resolveMode(): OutputMode {
    const configuredMode = process.env.ARDIS_OUTPUT_MODE?.trim().toLowerCase();

    if (
      configuredMode === 'filesystem' ||
      configuredMode === 'blob' ||
      configuredMode === 'azure-files' ||
      configuredMode === 'both' ||
      configuredMode === 'auto'
    ) {
      return configuredMode;
    }

    return 'auto';
  }
}
