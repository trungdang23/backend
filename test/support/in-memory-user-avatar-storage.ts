import { Readable } from 'node:stream';

import type {
  SaveUserAvatarFileInput,
  SavedUserAvatarFile,
  UserAvatarFile,
  UserAvatarStoragePort,
} from '../../src/modules/users/application/ports/user-avatar-storage.port';

export class InMemoryUserAvatarStorage implements UserAvatarStoragePort {
  private readonly filesByStorageKey = new Map<string, Buffer>();

  save(input: SaveUserAvatarFileInput): Promise<SavedUserAvatarFile> {
    const storageKey = `${input.publicId}.avatar`;

    this.filesByStorageKey.set(storageKey, Buffer.from(input.buffer));

    return Promise.resolve({
      storageKey,
    });
  }

  read(storageKey: string): Promise<UserAvatarFile | null> {
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
