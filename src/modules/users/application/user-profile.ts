import type { User } from './user';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl:
      user.avatarPublicId === undefined || user.avatarPublicId === null
        ? null
        : buildUserAvatarPath(user.avatarPublicId),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function buildUserAvatarPath(publicId: string): string {
  return `/user-avatars/${encodeURIComponent(publicId)}`;
}
