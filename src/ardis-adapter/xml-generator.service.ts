import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { GenerateXmlDto, GenerateXmlPartDto } from './dto/generate-xml.dto';
import {
  ArdisEdgeMapping,
  ArdisMaterialMapping,
} from './types/ardis.types';

@Injectable()
export class XmlGeneratorService {
  generate(
    payload: GenerateXmlDto,
    materialMap: Map<string, ArdisMaterialMapping>,
    edgeMap: Map<string, ArdisEdgeMapping>,
  ): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' }).ele(
      'ArdisOptimizerProject',
    );

    // PartCollection: generated from each incoming cutlist part.
    const partCollection = doc.ele('PartCollection');
    const partFile = partCollection.ele('PartFile', {
      ID: payload.projectNumber,
      Version: '16.03.31',
    });

    const partList = partFile.ele('PartList');
    for (const part of payload.parts) {
      this.appendPart(partList, part, payload, materialMap, edgeMap);
    }

    this.appendPartFileProperties(partFile, payload);
    partFile.ele('VariableList');

    // SheetCollection: one sheet file with one sheet per unique material.
    const sheetCollection = doc.ele('SheetCollection');
    const sheetFile = sheetCollection.ele('SheetFile', {
      ID: payload.projectNumber,
      Version: '16.03.31',
    });

    const sheetList = sheetFile.ele('SheetList');
    const uniqueMaterials = [...new Set(payload.parts.map((part) => part.materialCode))];
    for (const materialCode of uniqueMaterials) {
      const material = materialMap.get(materialCode)!;
      this.appendSheet(sheetList, material);
    }

    this.appendSheetFileProperties(sheetFile);

    // MachineCollection: static machine metadata for the Selco optimizer target.
    this.appendMachineCollection(doc);

    // EdgeCollection: one edge definition per unique non-empty edge code.
    const edgeCollection = doc.ele('EdgeCollection');
    const uniqueEdgeCodes = [...new Set(this.collectEdgeCodes(payload.parts))];
    for (const edgeCode of uniqueEdgeCodes) {
      const edge = edgeMap.get(edgeCode)!;
      this.appendEdge(edgeCollection, edge);
    }

    // ProjectSettings: static optimizer settings with the project number in remark 3.
    this.appendProjectSettings(doc, payload.projectNumber);

    // Result: intentionally empty in this proof of concept.
    doc.ele('Result');

    return doc.end({
      prettyPrint: true,
      headless: false,
      allowEmptyTags: true,
    });
  }

  private appendPart(
    partList: XMLBuilder,
    part: GenerateXmlPartDto,
    payload: GenerateXmlDto,
    materialMap: Map<string, ArdisMaterialMapping>,
    edgeMap: Map<string, ArdisEdgeMapping>,
  ): void {
    const material = materialMap.get(part.materialCode)!;
    const edgeCodes = [
      part.edge1 ?? '',
      part.edge2 ?? '',
      part.edge3 ?? '',
      part.edge4 ?? '',
    ];
    const edgeNames = edgeCodes.map((code) =>
      code.trim() ? edgeMap.get(code)?.ardisEdgeName ?? '' : '',
    );

    const partNode = partList.ele('Part');
    this.appendTextElement(partNode, 'PartRef', part.partReference);
    this.appendTextElement(partNode, 'PartL', part.lengthMm);
    this.appendTextElement(partNode, 'PartW', part.widthMm);
    this.appendTextElement(partNode, 'PartD', '');
    this.appendTextElement(partNode, 'PartQty', part.quantity);
    this.appendTextElement(partNode, 'PartCost', 0.0);
    this.appendTextElement(partNode, 'PartMat', '{{PART_MAT_FORMULA}}');
    this.appendTextElement(partNode, 'PartWMin', '');
    this.appendTextElement(partNode, 'PartEdge1', edgeNames[0]);
    this.appendTextElement(partNode, 'PartEdge2', edgeNames[1]);
    this.appendTextElement(partNode, 'PartEdge3', edgeNames[2]);
    this.appendTextElement(partNode, 'PartEdge4', edgeNames[3]);
    this.appendTextElement(partNode, 'PartEdgeSeq', '');
    this.appendTextElement(partNode, 'PartRemark', '');
    this.appendTextElement(partNode, 'PartRemark2', '');
    this.appendTextElement(partNode, 'PartDraw', '');
    this.appendTextElement(partNode, 'PartExt01', '');
    this.appendTextElement(partNode, 'PartExt02', '');
    this.appendTextElement(partNode, 'PartExt03', '');
    this.appendTextElement(partNode, 'PartExt04', '');
    this.appendTextElement(partNode, 'PartExt05', '');
    this.appendTextElement(partNode, 'PartExt06', '');
    this.appendTextElement(partNode, 'PartExt07', '');
    this.appendTextElement(partNode, 'PartExt08', '');
    this.appendTextElement(partNode, 'PartExt09', '');
    this.appendTextElement(
      partNode,
      'PartExt10',
      '=PartEdge1ID + PartEdge2ID + PartEdge3ID + PartEdge4ID',
    );
    this.appendTextElement(partNode, 'PartExt11', material.ardisMaterialName);
    this.appendTextElement(partNode, 'PartExt12', 0.0);
    this.appendTextElement(partNode, 'PartExt15', '//$$!0.0$/!/$$!0.0!//$$!0.0');
    this.appendTextElement(
      partNode,
      'PartExt16',
      '=REPLACE(REPLACE(PartExt19; "|";";");":";";")',
    );
    this.appendTextElement(partNode, 'PartExt17', material.ardisMaterialName);
    this.appendTextElement(partNode, 'PartExt18', material.ardisMaterialName);
    this.appendTextElement(partNode, 'PartExt19', part.machiningRaw ?? '');
    this.appendTextElement(partNode, 'PartExt20', payload.projectReference ?? '');
  }

  private appendPartFileProperties(partFile: XMLBuilder, payload: GenerateXmlDto): void {
    const properties = partFile.ele('PartFileProperties');
    this.appendTextElement(
      properties,
      'PartFName',
      `${payload.customerName}_${payload.projectNumber}`,
    );
    this.appendTextElement(
      properties,
      'PartFDate',
      `Delivery date ${payload.deliveryDate ?? ''}`,
    );
    this.appendTextElement(properties, 'PartFRef', `${payload.projectNumber};;;`);
    this.appendTextElement(
      properties,
      'PartFExt02',
      `${payload.customerName};${payload.customerEmail ?? ''}`,
    );
    this.appendTextElement(
      properties,
      'PartFExt04',
      `Date commande ${payload.orderDate ?? ''}`,
    );
    this.appendTextElement(properties, 'PartFExt05', payload.projectNumber);
    this.appendTextElement(properties, 'PartFExt06', payload.deliveryMethod ?? '');
    this.appendTextElement(
      properties,
      'PartFExt07',
      `${payload.deliveryMethod ?? ''};0 ;labels;0 `,
    );
    this.appendTextElement(properties, 'PartFExt10', payload.projectReference ?? '');
    this.appendTextElement(properties, 'PartFExt16', payload.customerName);
    this.appendTextElement(properties, 'PartFExt17', 1);
    this.appendTextElement(properties, 'PartFExt18', 8);
    this.appendTextElement(properties, 'PartFExt19', 2.5);
    this.appendTextElement(properties, 'PartFExt20', 2.31);
    this.appendTextElement(properties, 'PartFFigParam', '=PartFCutThick');
    this.appendTextElement(properties, 'PartFFigParam', 3.2);
    this.appendTextElement(properties, 'PartFCX', 3000);
    this.appendTextElement(properties, 'PartFCY', 2000);
    this.appendTextElement(properties, 'PartFCZ', 100);
  }

  private appendSheet(sheetList: XMLBuilder, material: ArdisMaterialMapping): void {
    const sheetNode = sheetList.ele('Sheet');
    this.appendTextElement(sheetNode, 'SheetMat', material.ardisMaterialName);
    this.appendTextElement(sheetNode, 'SheetThick', material.thicknessMm);
    this.appendTextElement(sheetNode, 'SheetL', material.sheetLengthMm);
    this.appendTextElement(sheetNode, 'SheetW', material.sheetWidthMm);
    this.appendTextElement(sheetNode, 'SheetNoLimit', material.sheetNoLimit);
    this.appendTextElement(sheetNode, 'SheetRef', material.description);
    this.appendTextElement(sheetNode, 'SheetD', material.sheetD);
    this.appendTextElement(sheetNode, 'SheetEXT09', material.ardisMaterialName);
    this.appendTextElement(sheetNode, 'SheetEXT10', material.ardisMaterialName);
    this.appendTextElement(sheetNode, 'SheetID', `${material.rawMaterialCode};0`);
    this.appendTextElement(sheetNode, 'SheetPrice', material.sheetPrice);
    this.appendTextElement(sheetNode, 'SheetEXT01', material.rawMaterialCode);
    this.appendTextElement(sheetNode, 'SheetEXT02', material.finishedGoodCode);
    this.appendTextElement(sheetNode, 'SheetEXT03', material.offcutCode);
    this.appendTextElement(sheetNode, 'SheetEXT04', material.sheetPrice);
    this.appendTextElement(sheetNode, 'SheetRemark', material.sheetRemark);
    this.appendTextElement(sheetNode, 'SheetMach', material.sheetMach);
    this.appendTextElement(sheetNode, 'SheetTrimMinUpper', material.trimMinUpper);
    this.appendTextElement(sheetNode, 'SheetTrimMinRight', material.trimMinRight);
    this.appendTextElement(sheetNode, 'SheetTrimMinBottom', material.trimMinBottom);
    this.appendTextElement(sheetNode, 'SheetTrimMinLeft', material.trimMinLeft);
    this.appendTextElement(sheetNode, 'SheetRestmL', material.restMinLength);
    this.appendTextElement(sheetNode, 'SheetRestmW', material.restMinWidth);
    this.appendTextElement(sheetNode, 'Sheet1LevelStrips', material.oneLevelStrips);
    this.appendTextElement(sheetNode, 'SheetQty', material.sheetQty);
  }

  private appendSheetFileProperties(sheetFile: XMLBuilder): void {
    const properties = sheetFile.ele('SheetFileProperties');
    this.appendTextElement(properties, 'SheetFName', `ARDIS_WEB_${uuidv4()}`);
    this.appendTextElement(properties, 'SheetFDate', '061009');
    this.appendTextElement(properties, 'SheetFOffcut', 'nieuweresten');
  }

  private appendMachineCollection(root: XMLBuilder): void {
    const machineCollection = root.ele('MachineCollection');
    const machineFile = machineCollection.ele('MachineFile', {
      ID: 'SELCO',
      Version: '16.03.31',
    });
    const machineProperties = machineFile.ele('MachineFileProperties');
    this.appendTextElement(machineProperties, 'MachBlade1L', 4.4);
    this.appendTextElement(machineProperties, 'MachMaxLevels', 4);
    this.appendTextElement(machineProperties, 'MachBookH', 50);
    this.appendTextElement(machineProperties, 'Loading', 1);
    this.appendTextElement(machineProperties, 'MachDescr', 'Selco');
  }

  private appendEdge(edgeCollection: XMLBuilder, edge: ArdisEdgeMapping): void {
    const edgeNode = edgeCollection.ele('Edge');
    this.appendTextElement(edgeNode, 'EdgeID', edge.ardisEdgeName);
    this.appendTextElement(edgeNode, 'EdgeDescr', edge.description);
    this.appendTextElement(edgeNode, 'EdgeThick', edge.thicknessMm);
    this.appendTextElement(edgeNode, 'EdgeMinHeight', edge.minHeightMm);
    this.appendTextElement(edgeNode, 'EdgeMaxHeight', edge.maxHeightMm);
    this.appendTextElement(edgeNode, 'EdgeMinL', edge.minLength);
    this.appendTextElement(edgeNode, 'EdgeMaxL', edge.maxLength);
    this.appendTextElement(edgeNode, 'EdgeVal', edge.edgeValue);
    this.appendTextElement(edgeNode, 'EdgeCorr', edge.edgeCorrection);
    this.appendTextElement(edgeNode, 'EdgeSuppl', edge.edgeSupplier);
    this.appendTextElement(edgeNode, 'EdgePrg', edge.edgeCode);
    this.appendTextElement(edgeNode, 'EdgeTrim', edge.edgeTrim);
  }

  private appendProjectSettings(root: XMLBuilder, projectNumber: string): void {
    const settings = root.ele('ProjectSettings');
    this.appendTextElement(settings, 'OptparMode', 1);
    this.appendTextElement(settings, 'OptparAlgor', 1);
    this.appendTextElement(settings, 'OptparMinLevel', 99);
    this.appendTextElement(settings, 'OptparMaxLevel', 99);
    this.appendTextElement(settings, 'OptparTechType', 1);
    this.appendTextElement(settings, 'OptparTechFact', 3);
    this.appendTextElement(settings, 'OptparBasicType', 1);
    this.appendTextElement(settings, 'OptparConstr1', 3);
    this.appendTextElement(settings, 'OPTPARREMARK3', `;${projectNumber}`);
    this.appendTextElement(settings, 'Version', 'Cutting Optimizer 16.03.31');
    this.appendTextElement(settings, 'UserName', 'ardis-web');
    this.appendTextElement(settings, 'StripInfo', 2);
    this.appendTextElement(settings, 'IgnoreSubDocs', 0);
  }

  private collectEdgeCodes(parts: GenerateXmlPartDto[]): string[] {
    return parts.flatMap((part) =>
      [part.edge1, part.edge2, part.edge3, part.edge4]
        .map((edgeCode) => edgeCode?.trim() ?? '')
        .filter((edgeCode) => edgeCode.length > 0),
    );
  }

  private appendTextElement(parent: XMLBuilder, name: string, value: string | number): void {
    parent.ele(name).txt(String(value));
  }
}
