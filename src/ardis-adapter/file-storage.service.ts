import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

@Injectable()
export class FileStorageService {
  private readonly projectRoot = process.cwd();
  private readonly generatedDir = join(this.projectRoot, 'storage', 'generated');
  private readonly logsDir = join(this.projectRoot, 'storage', 'logs');

  async saveGeneratedXml(fileName: string, xml: string): Promise<string> {
    const fullPath = join(this.generatedDir, fileName);
    await this.ensureDirectory(fullPath);
    await writeFile(fullPath, xml, 'utf-8');
    return fullPath;
  }

  async saveLog(projectNumber: string, payload: unknown): Promise<string> {
    const fullPath = join(this.logsDir, `${projectNumber}.json`);
    await this.ensureDirectory(fullPath);
    await writeFile(fullPath, JSON.stringify(payload, null, 2), 'utf-8');
    return fullPath;
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
  }
}
