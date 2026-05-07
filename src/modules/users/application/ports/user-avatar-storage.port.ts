import type { UserAvatarContentType } from '../../domain/user-avatar';

export const USER_AVATAR_STORAGE = Symbol('USER_AVATAR_STORAGE');

export interface SaveUserAvatarFileInput {
  buffer: Buffer;
  contentType: UserAvatarContentType;
  publicId: string;
}

export interface SavedUserAvatarFile {
  storageKey: string;
}

export interface UserAvatarFile {
  byteSize: number;
  stream: NodeJS.ReadableStream;
}

export interface UserAvatarStoragePort {
  save(input: SaveUserAvatarFileInput): Promise<SavedUserAvatarFile>;
  read(storageKey: string): Promise<UserAvatarFile | null>;
  delete(storageKey: string): Promise<void>;
}
