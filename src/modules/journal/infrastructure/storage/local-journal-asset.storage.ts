import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../../app/config/app-config.service';
import type {
  JournalAssetFile,
  JournalAssetStoragePort,
  SaveJournalAssetFileInput,
  SavedJournalAssetFile,
} from '../../application/ports/journal-asset-storage.port';
import { resolveJournalAssetFilePath, resolveJournalAssetRootDir } from './journal-asset-storage-path';

@Injectable()
export class LocalJournalAssetStorage implements JournalAssetStoragePort {
  constructor(private readonly config: AppConfigService) {}

  async save(input: SaveJournalAssetFileInput): Promise<SavedJournalAssetFile> {
    const storageKey = `${input.publicId}${resolveFileExtension(input.contentType)}`;
    const filePath = this.resolveFilePath(storageKey);

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, input.buffer, {
      flag: 'wx',
    });

    return {
      storageKey,
    };
  }

  async read(storageKey: string): Promise<JournalAssetFile | null> {
    const filePath = this.resolveFilePath(storageKey);

    try {
      const stats = await stat(filePath);

      if (!stats.isFile()) {
        return null;
      }

      return {
        byteSize: stats.size,
        stream: createReadStream(filePath),
      };
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = this.resolveFilePath(storageKey);

    try {
      await unlink(filePath);
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return;
      }

      throw error;
    }
  }

  private resolveFilePath(storageKey: string) {
    return resolveJournalAssetFilePath(this.config, storageKey);
  }

  private resolveRootDir() {
    return resolveJournalAssetRootDir(this.config);
  }
}

function resolveFileExtension(contentType: string) {
  switch (contentType) {
    case 'image/gif':
      return '.gif';
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.bin';
  }
}

function isFileNotFoundError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
