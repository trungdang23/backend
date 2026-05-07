import { DomainError } from '../../../shared/domain/domain-error';

export const MAX_USER_AVATAR_BYTES = 2 * 1024 * 1024;
export const USER_AVATAR_CONTENT_TYPES = [
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type UserAvatarContentType = (typeof USER_AVATAR_CONTENT_TYPES)[number];

export interface UserAvatarInput {
  fileName: string;
  contentType: string;
  byteSize: number;
  storageKey: string;
  publicId: string;
}

export interface UserAvatar {
  fileName: string;
  contentType: UserAvatarContentType;
  byteSize: number;
  storageKey: string;
  publicId: string;
}

export function createUserAvatar(input: UserAvatarInput): UserAvatar {
  return {
    fileName: normalizeFileName(input.fileName),
    contentType: normalizeContentType(input.contentType),
    byteSize: normalizeByteSize(input.byteSize),
    storageKey: normalizeIdentifier(input.storageKey, 'Avatar storage key'),
    publicId: normalizeIdentifier(input.publicId, 'Avatar public id'),
  };
}

export function isSupportedUserAvatarContentType(
  value: string,
): value is UserAvatarContentType {
  return USER_AVATAR_CONTENT_TYPES.includes(value as UserAvatarContentType);
}

function normalizeIdentifier(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeFileName(value: string): string {
  const normalizedValue = value.replace(/[/\\]/g, '').trim();

  if (normalizedValue.length === 0) {
    throw new DomainError('Avatar file name is required.');
  }

  if (normalizedValue.length > 180) {
    throw new DomainError('Avatar file name is too long.');
  }

  return normalizedValue;
}

function normalizeContentType(value: string): UserAvatarContentType {
  const normalizedValue = value.trim().toLowerCase();

  if (!isSupportedUserAvatarContentType(normalizedValue)) {
    throw new DomainError('Avatar must be a supported image file.');
  }

  return normalizedValue;
}

function normalizeByteSize(value: number): number {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_USER_AVATAR_BYTES
  ) {
    throw new DomainError(
      `Avatar must be between 1 byte and ${MAX_USER_AVATAR_BYTES} bytes.`,
    );
  }

  return value;
}
