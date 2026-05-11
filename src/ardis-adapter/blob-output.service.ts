import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { StoredFileResult } from './types/ardis.types';

@Injectable()
export class BlobOutputService {
  private readonly blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  async saveGeneratedXml(fileName: string, xml: string): Promise<StoredFileResult> {
    const blob = await put(this.buildBlobPath('generated', fileName), xml, {
      access: 'public',
      contentType: 'application/xml',
      addRandomSuffix: false,
      token: this.requireToken(),
    });

    return {
      mode: 'blob',
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    };
  }

  async saveLog(projectNumber: string, payload: unknown): Promise<StoredFileResult> {
    const fileName = `${projectNumber}.json`;
    const blob = await put(
      this.buildBlobPath('logs', fileName),
      JSON.stringify(payload, null, 2),
      {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        token: this.requireToken(),
      },
    );

    return {
      mode: 'blob',
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    };
  }

  isConfigured(): boolean {
    return Boolean(this.blobToken);
  }

  private buildBlobPath(folder: 'generated' | 'logs', fileName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${folder}/${timestamp}-${uuidv4()}-${fileName}`;
  }

  private requireToken(): string {
    if (!this.blobToken) {
      throw new InternalServerErrorException(
        'BLOB_READ_WRITE_TOKEN is required for blob delivery mode.',
      );
    }

    return this.blobToken;
  }
}
