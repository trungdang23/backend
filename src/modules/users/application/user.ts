export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  avatarFileName?: string | null;
  avatarContentType?: string | null;
  avatarByteSize?: number | null;
  avatarStorageKey?: string | null;
  avatarPublicId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
