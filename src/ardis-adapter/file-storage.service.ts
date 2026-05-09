import { Injectable } from '@nestjs/common';
import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

interface StoredFileResult {
  pathname: string;
  url?: string;
  downloadUrl?: string;
}

@Injectable()
export class FileStorageService {
  private readonly storageRoot = process.env.VERCEL
    ? join(tmpdir(), 'ardis-adapter-poc')
    : process.cwd();
  private readonly generatedDir = join(this.storageRoot, 'storage', 'generated');
  private readonly logsDir = join(this.storageRoot, 'storage', 'logs');
  private readonly blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  async saveGeneratedXml(fileName: string, xml: string): Promise<StoredFileResult> {
    if (this.blobToken) {
      const pathname = `generated/${fileName}`;
      const blob = await put(pathname, xml, {
        access: 'public',
        contentType: 'application/xml',
        addRandomSuffix: false,
        allowOverwrite: true,
        token: this.blobToken,
      });

      return {
        pathname: blob.pathname,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
      };
    }

    const fullPath = join(this.generatedDir, fileName);
    await this.ensureDirectory(fullPath);
    await writeFile(fullPath, xml, 'utf-8');

    return {
      pathname: `storage/generated/${fileName}`,
      url: fullPath,
    };
  }

  async saveLog(projectNumber: string, payload: unknown): Promise<StoredFileResult> {
    const fileName = `${projectNumber}.json`;
    const fileContents = JSON.stringify(payload, null, 2);

    if (this.blobToken) {
      const pathname = `logs/${fileName}`;
      const blob = await put(pathname, fileContents, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token: this.blobToken,
      });

      return {
        pathname: blob.pathname,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
      };
    }

    const fullPath = join(this.logsDir, fileName);
    await this.ensureDirectory(fullPath);
    await writeFile(fullPath, fileContents, 'utf-8');

    return {
      pathname: `storage/logs/${fileName}`,
      url: fullPath,
    };
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
  }
}
