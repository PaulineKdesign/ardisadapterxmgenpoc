import { Injectable } from '@nestjs/common';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { v4 as uuidv4 } from 'uuid';
import { StoredFileResult } from './types/ardis.types';

@Injectable()
export class FilesystemOutputService {
  private readonly storageRoot = process.env.VERCEL
    ? join(tmpdir(), 'ardis-adapter-poc')
    : process.cwd();
  private readonly generatedDir =
    process.env.ARDIS_FILE_DROP_PATH || join(this.storageRoot, 'storage', 'generated');
  private readonly logsDir =
    process.env.ARDIS_LOG_PATH || join(this.storageRoot, 'storage', 'logs');

  async saveGeneratedXml(fileName: string, xml: string): Promise<StoredFileResult> {
    const fullPath = join(this.generatedDir, fileName);
    await this.writeAtomically(fullPath, xml);

    return {
      mode: 'filesystem',
      pathname: fullPath,
      absolutePath: fullPath,
      url: fullPath,
    };
  }

  async saveLog(projectNumber: string, payload: unknown): Promise<StoredFileResult> {
    const fileName = `${projectNumber}.json`;
    const fullPath = join(this.logsDir, fileName);
    const fileContents = JSON.stringify(payload, null, 2);
    await this.writeAtomically(fullPath, fileContents);

    return {
      mode: 'filesystem',
      pathname: fullPath,
      absolutePath: fullPath,
      url: fullPath,
    };
  }

  private async writeAtomically(fullPath: string, content: string): Promise<void> {
    await mkdir(dirname(fullPath), { recursive: true });
    const tempPath = `${fullPath}.${uuidv4()}.tmp`;
    await writeFile(tempPath, content, 'utf-8');
    await rename(tempPath, fullPath);
  }
}
