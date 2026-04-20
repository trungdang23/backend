import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';

export const POST_VISIBILITIES = ['public'] as const;
export const MAX_POST_TITLE_LENGTH = 120;
export const MAX_POST_CONTENT_LENGTH = 20_000;
export const MAX_POST_COVER_IMAGE_URL_LENGTH = 2_048;

export type PostVisibility = (typeof POST_VISIBILITIES)[number];

interface PostProps extends Record<string, unknown> {
  id: string;
  userId: string;
  tripId: string | null;
  title: string;
  content: string;
  coverImageUrl: string | null;
  visibility: PostVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostInput {
  id?: string;
  userId: string;
  tripId?: string | null;
  title: string;
  content: string;
  coverImageUrl?: string | null;
  visibility?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Post extends Entity<PostProps> {
  private constructor(props: PostProps) {
    super(props);
  }

  static create(input: PostInput): Post {
    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');

    return new Post({
      id: normalizeIdentifier(input.id ?? randomUUID(), 'Post id'),
      userId: normalizeIdentifier(input.userId, 'User id'),
      tripId: normalizeOptionalIdentifier(input.tripId),
      title: normalizeRequiredString(
        input.title,
        'Post title',
        MAX_POST_TITLE_LENGTH,
      ),
      content: normalizeRequiredString(
        input.content,
        'Post content',
        MAX_POST_CONTENT_LENGTH,
      ),
      coverImageUrl: normalizeOptionalUrl(
        input.coverImageUrl,
        'Post cover image URL',
      ),
      visibility: normalizePostVisibility(input.visibility),
      createdAt,
      updatedAt,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get tripId(): string | null {
    return this.props.tripId;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get coverImageUrl(): string | null {
    return this.props.coverImageUrl;
  }

  get visibility(): PostVisibility {
    return this.props.visibility;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function normalizeIdentifier(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalIdentifier(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeRequiredString(
  value: string,
  label: string,
  maxLength: number,
): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  if (normalizedValue.length > maxLength) {
    throw new DomainError(`${label} must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
}

function normalizeOptionalString(
  value: string | null | undefined,
  label: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    throw new DomainError(`${label} must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
}

function normalizeOptionalUrl(
  value: string | null | undefined,
  label: string,
): string | null {
  const normalizedValue = normalizeOptionalString(
    value,
    label,
    MAX_POST_COVER_IMAGE_URL_LENGTH,
  );

  if (normalizedValue === null) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new DomainError(`${label} must be a valid http or https URL.`);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new DomainError(`${label} must be a valid http or https URL.`);
  }

  return normalizedValue;
}

function normalizePostVisibility(value?: string): PostVisibility {
  if (value === undefined) {
    return 'public';
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue !== 'public') {
    throw new DomainError('Post visibility must be public.');
  }

  return 'public';
}

function ensureDate(value: Date, label: string): Date {
  if (Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be a valid date.`);
  }

  return value;
}
