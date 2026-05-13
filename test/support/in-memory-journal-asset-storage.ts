import { Readable } from 'node:stream';

import type {
  JournalAssetFile,
  JournalAssetStoragePort,
  SaveJournalAssetFileInput,
  SavedJournalAssetFile,
} from '../../src/modules/journal/application/ports/journal-asset-storage.port';

export class InMemoryJournalAssetStorage implements JournalAssetStoragePort {
  private readonly filesByStorageKey = new Map<string, Buffer>();

  save(input: SaveJournalAssetFileInput): Promise<SavedJournalAssetFile> {
    const storageKey = `${input.publicId}.asset`;

    this.filesByStorageKey.set(storageKey, Buffer.from(input.buffer));

    return Promise.resolve({
      storageKey,
    });
  }

  read(storageKey: string): Promise<JournalAssetFile | null> {
    const file = this.filesByStorageKey.get(storageKey);

    if (file === undefined) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      byteSize: file.byteLength,
      stream: Readable.from(file),
    });
  }

  delete(storageKey: string): Promise<void> {
    this.filesByStorageKey.delete(storageKey);

    return Promise.resolve();
  }

  has(storageKey: string): boolean {
    return this.filesByStorageKey.has(storageKey);
  }

  clear(): void {
    this.filesByStorageKey.clear();
  }
}
