export interface ArdisMaterialMapping {
  materialCode: string;
  ardisMaterialName: string;
  description: string;
  rawMaterialCode: string;
  finishedGoodCode: string;
  offcutCode: string;
  thicknessMm: number;
  sheetLengthMm: number;
  sheetWidthMm: number;
  sheetGrain: number;
  sheetNoLimit: number;
  sheetPrice: number;
  sheetQty: number;
  sheetD: number;
  sheetRemark: number;
  sheetMach: string;
  trimMinUpper: string;
  trimMinRight: string;
  trimMinBottom: string;
  trimMinLeft: string;
  restMinLength: string;
  restMinWidth: string;
  oneLevelStrips: string;
}

export interface ArdisEdgeMapping {
  edgeCode: string;
  ardisEdgeName: string;
  description: string;
  thicknessMm: number;
  minHeightMm: number;
  maxHeightMm: number;
  minLength: number;
  maxLength: number;
  edgeValue: number;
  edgeCorrection: string;
  edgeSupplier: number;
  edgeTrim: string;
}

export interface GeneratedXmlResponse {
  success: boolean;
  projectNumber: string;
  fileName: string;
  generatedPath: string;
  deliveryMode?: OutputMode;
  fileSystemPath?: string;
  azureFilePath?: string;
  azureFileUrl?: string;
  blobUrl?: string;
  downloadUrl?: string;
  logPath?: string;
  logFileSystemPath?: string;
  azureLogFilePath?: string;
  azureLogFileUrl?: string;
  logBlobUrl?: string;
}

export type OutputMode = 'filesystem' | 'blob' | 'azure-files' | 'both' | 'auto';

export interface StoredFileResult {
  mode: 'filesystem' | 'blob' | 'azure-files';
  pathname: string;
  absolutePath?: string;
  url?: string;
  downloadUrl?: string;
}

export interface DeliveryResult {
  primary: StoredFileResult;
  secondary: StoredFileResult[];
}
