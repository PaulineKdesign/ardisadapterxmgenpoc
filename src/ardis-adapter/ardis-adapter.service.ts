import { BadRequestException, Injectable } from '@nestjs/common';
import { GenerateXmlDto } from './dto/generate-xml.dto';
import { FileStorageService } from './file-storage.service';
import materials from '../mappings/materials.json';
import edges from '../mappings/edges.json';
import { XmlGeneratorService } from './xml-generator.service';
import {
  ArdisEdgeMapping,
  ArdisMaterialMapping,
  GeneratedXmlResponse,
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
    private readonly fileStorageService: FileStorageService,
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
    await this.fileStorageService.saveGeneratedXml(fileName, xml);

    const response: GeneratedXmlResponse = {
      success: true,
      projectNumber: payload.projectNumber,
      fileName,
      generatedPath: `storage/generated/${fileName}`,
    };

    await this.fileStorageService.saveLog(payload.projectNumber, {
      createdAt: new Date().toISOString(),
      request: payload,
      response,
    });

    return response;
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
