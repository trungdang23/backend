import type { User } from '../user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByAvatarPublicId(publicId: string): Promise<User | null>;
  create(input: {
    email: string;
    passwordHash: string;
    displayName?: string | null;
  }): Promise<User>;
  updateProfile(input: {
    userId: string;
    displayName: string | null;
  }): Promise<User | null>;
  updateAvatar(input: {
    userId: string;
    fileName: string;
    contentType: string;
    byteSize: number;
    storageKey: string;
    publicId: string;
  }): Promise<{ user: User; previousStorageKey: string | null } | null>;
  clearAvatar(input: {
    userId: string;
  }): Promise<{ user: User; previousStorageKey: string | null } | null>;
}
