import { BadRequestException, Injectable } from '@nestjs/common';
import { GenerateXmlDto } from './dto/generate-xml.dto';
import materials from '../mappings/materials.json';
import edges from '../mappings/edges.json';
import { OutputDeliveryService } from './output-delivery.service';
import { XmlGeneratorService } from './xml-generator.service';
import {
  ArdisEdgeMapping,
  ArdisMaterialMapping,
  GeneratedXmlResponse,
  StoredFileResult,
} from './types/ardis.types';

@Injectable()
export class ArdisAdapterService {
  private readonly materialMap = new Map<string, ArdisMaterialMapping>(
    (materials as ArdisMaterialMapping[]).map((material) => [
      material.materialCode,
      material,
    ]),
  );

  private readonly edgeMap = new Map<string, ArdisEdgeMapping>(
    (edges as ArdisEdgeMapping[]).map((edge) => [edge.edgeCode, edge]),
  );

  constructor(
    private readonly xmlGeneratorService: XmlGeneratorService,
    private readonly outputDeliveryService: OutputDeliveryService,
  ) {}

  async generateXml(payload: GenerateXmlDto): Promise<GeneratedXmlResponse> {
    const validationErrors = this.validateMappings(payload);

    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed for Ardis XML generation.',
        errors: validationErrors,
      });
    }

    const xml = this.xmlGeneratorService.generate(
      payload,
      this.materialMap,
      this.edgeMap,
    );

    const fileName = `Project_${payload.projectNumber}.xml`;
    const generatedFile = await this.outputDeliveryService.saveGeneratedXml(fileName, xml);

    const response: GeneratedXmlResponse = {
      success: true,
      projectNumber: payload.projectNumber,
      fileName,
      deliveryMode: process.env.ARDIS_OUTPUT_MODE?.toLowerCase() as GeneratedXmlResponse['deliveryMode'],
      generatedPath: generatedFile.primary.pathname,
    };
    this.applyStoredFileResultToResponse(response, generatedFile.primary);
    generatedFile.secondary.forEach((file) => this.applyStoredFileResultToResponse(response, file));

    const logFile = await this.outputDeliveryService.saveLog(payload.projectNumber, {
      createdAt: new Date().toISOString(),
      request: payload,
      response,
    });

    response.logPath = logFile.primary.pathname;
    this.applyLogStoredFileResultToResponse(response, logFile.primary);
    logFile.secondary.forEach((file) => this.applyLogStoredFileResultToResponse(response, file));

    return response;
  }

  private applyStoredFileResultToResponse(
    response: GeneratedXmlResponse,
    file: StoredFileResult,
  ): void {
    if (file.mode === 'filesystem') {
      response.fileSystemPath = file.absolutePath ?? file.pathname;
      response.generatedPath = file.pathname;
      return;
    }

    if (file.mode === 'azure-files') {
      response.azureFilePath = file.pathname;
      response.azureFileUrl = file.url;
      response.generatedPath = file.pathname;
      return;
    }

    response.blobUrl = file.url;
    response.downloadUrl = file.downloadUrl;
    if (!response.fileSystemPath) {
      response.generatedPath = file.pathname;
    }
  }

  private applyLogStoredFileResultToResponse(
    response: GeneratedXmlResponse,
    file: StoredFileResult,
  ): void {
    if (file.mode === 'filesystem') {
      response.logFileSystemPath = file.absolutePath ?? file.pathname;
      response.logPath = file.pathname;
      return;
    }

    if (file.mode === 'azure-files') {
      response.azureLogFilePath = file.pathname;
      response.azureLogFileUrl = file.url;
      response.logPath = file.pathname;
      return;
    }

    response.logBlobUrl = file.url;
    if (!response.logFileSystemPath) {
      response.logPath = file.pathname;
    }
  }

  private validateMappings(payload: GenerateXmlDto): string[] {
    const errors: string[] = [];

    if (!payload.projectNumber?.trim()) {
      errors.push('projectNumber is required.');
    }

    if (!payload.customerName?.trim()) {
      errors.push('customerName is required.');
    }

    if (!payload.parts?.length) {
      errors.push('At least one part is required.');
      return errors;
    }

    payload.parts.forEach((part, index) => {
      const partLabel = `parts[${index}]`;

      if (!part.materialCode?.trim()) {
        errors.push(`${partLabel}.materialCode is required.`);
      } else if (!this.materialMap.has(part.materialCode)) {
        errors.push(
          `${partLabel}.materialCode "${part.materialCode}" does not exist in materials.json.`,
        );
      }

      if (!part.lengthMm) {
        errors.push(`${partLabel}.lengthMm is required.`);
      }

      if (!part.widthMm) {
        errors.push(`${partLabel}.widthMm is required.`);
      }

      if (!part.quantity) {
        errors.push(`${partLabel}.quantity is required.`);
      }

      [part.edge1, part.edge2, part.edge3, part.edge4].forEach((edgeCode, edgeIndex) => {
        if (edgeCode?.trim() && !this.edgeMap.has(edgeCode)) {
          errors.push(
            `${partLabel}.edge${edgeIndex + 1} "${edgeCode}" does not exist in edges.json.`,
          );
        }
      });
    });

    return errors;
  }
}
