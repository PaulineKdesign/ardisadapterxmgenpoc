import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  ShareDirectoryClient,
  ShareServiceClient,
} from '@azure/storage-file-share';
import { StoredFileResult } from './types/ardis.types';

@Injectable()
export class AzureFilesOutputService {
  private readonly connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  private readonly shareName = process.env.AZURE_FILE_SHARE_NAME;
  private readonly xmlDirectory = process.env.AZURE_FILE_DIRECTORY || '';
  private readonly logDirectory =
    process.env.AZURE_LOG_FILE_DIRECTORY || process.env.AZURE_FILE_DIRECTORY || '';

  async saveGeneratedXml(fileName: string, xml: string): Promise<StoredFileResult> {
    return this.writeFile(this.xmlDirectory, fileName, xml, 'generated');
  }

  async saveLog(projectNumber: string, payload: unknown): Promise<StoredFileResult> {
    return this.writeFile(
      this.logDirectory,
      `${projectNumber}.json`,
      JSON.stringify(payload, null, 2),
      'logs',
    );
  }

  isConfigured(): boolean {
    return Boolean(this.connectionString && this.shareName);
  }

  private async writeFile(
    baseDirectory: string,
    fileName: string,
    content: string,
    folderLabel: 'generated' | 'logs',
  ): Promise<StoredFileResult> {
    const shareClient = this.getShareServiceClient().getShareClient(this.requireShareName());
    await shareClient.createIfNotExists();

    const directoryClient = await this.ensureDirectory(
      shareClient.rootDirectoryClient,
      baseDirectory,
    );

    const tempFileName = `${fileName}.uploading`;
    const tempFileClient = directoryClient.getFileClient(tempFileName);
    const contentLength = Buffer.byteLength(content, 'utf-8');
    await tempFileClient.create(contentLength);
    await tempFileClient.uploadRange(content, 0, contentLength);

    const destinationPath = this.combineDirectoryPath(baseDirectory, fileName);
    const renameResult = await tempFileClient.rename(destinationPath);
    const finalFileClient = renameResult.destinationFileClient;

    return {
      mode: 'azure-files',
      pathname: `${this.requireShareName()}/${destinationPath}`,
      url: finalFileClient.url,
      absolutePath: `${folderLabel}:${this.requireShareName()}/${destinationPath}`,
    };
  }

  private getShareServiceClient(): ShareServiceClient {
    if (!this.connectionString) {
      throw new InternalServerErrorException(
        'AZURE_STORAGE_CONNECTION_STRING is required for azure-files delivery mode.',
      );
    }

    return ShareServiceClient.fromConnectionString(this.connectionString);
  }

  private requireShareName(): string {
    if (!this.shareName) {
      throw new InternalServerErrorException(
        'AZURE_FILE_SHARE_NAME is required for azure-files delivery mode.',
      );
    }

    return this.shareName;
  }

  private async ensureDirectory(
    rootDirectoryClient: ShareDirectoryClient,
    directoryPath: string,
  ): Promise<ShareDirectoryClient> {
    const segments = directoryPath
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    let currentDirectoryClient = rootDirectoryClient;

    for (const segment of segments) {
      currentDirectoryClient = currentDirectoryClient.getDirectoryClient(segment);
      await currentDirectoryClient.createIfNotExists();
    }

    return currentDirectoryClient;
  }

  private combineDirectoryPath(directoryPath: string, fileName: string): string {
    const normalizedDirectory = directoryPath
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
      .join('/');

    return normalizedDirectory ? `${normalizedDirectory}/${fileName}` : fileName;
  }
}
