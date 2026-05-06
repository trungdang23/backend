import { DomainError } from '../../../shared/domain/domain-error';

export const MAX_TRIP_JOURNAL_ASSET_BYTES = 5 * 1024 * 1024;
export const TRIP_JOURNAL_ASSET_CONTENT_TYPES = [
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type TripJournalAssetContentType =
  (typeof TRIP_JOURNAL_ASSET_CONTENT_TYPES)[number];

export interface TripJournalAssetInput {
  id?: string | null;
  tripId: string;
  userId: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  storageKey: string;
  publicId: string;
  createdAt?: Date;
}

interface TripJournalAssetProps {
  id: string | null;
  tripId: string;
  userId: string;
  fileName: string;
  contentType: TripJournalAssetContentType;
  byteSize: number;
  storageKey: string;
  publicId: string;
  createdAt: Date;
}

export class TripJournalAsset {
  private constructor(private readonly props: TripJournalAssetProps) {}

  static create(input: TripJournalAssetInput): TripJournalAsset {
    return new TripJournalAsset({
      id: normalizeOptionalIdentifier(input.id, 'Journal asset id'),
      tripId: normalizeIdentifier(input.tripId, 'Trip id'),
      userId: normalizeIdentifier(input.userId, 'User id'),
      fileName: normalizeFileName(input.fileName),
      contentType: normalizeContentType(input.contentType),
      byteSize: normalizeByteSize(input.byteSize),
      storageKey: normalizeIdentifier(input.storageKey, 'Storage key'),
      publicId: normalizeIdentifier(input.publicId, 'Public id'),
      createdAt: ensureDate(input.createdAt ?? new Date(), 'Created at'),
    });
  }

  get id(): string | null {
    return this.props.id;
  }

  get tripId(): string {
    return this.props.tripId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get contentType(): TripJournalAssetContentType {
    return this.props.contentType;
  }

  get byteSize(): number {
    return this.props.byteSize;
  }

  get storageKey(): string {
    return this.props.storageKey;
  }

  get publicId(): string {
    return this.props.publicId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

export function isSupportedJournalAssetContentType(
  value: string,
): value is TripJournalAssetContentType {
  return TRIP_JOURNAL_ASSET_CONTENT_TYPES.includes(
    value as TripJournalAssetContentType,
  );
}

function normalizeIdentifier(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeOptionalIdentifier(
  value: string | null | undefined,
  label: string,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return normalizeIdentifier(value, label);
}

function normalizeFileName(value: string): string {
  const normalizedValue = value.replace(/[/\\]/g, '').trim();

  if (normalizedValue.length === 0) {
    throw new DomainError('Journal asset file name is required.');
  }

  if (normalizedValue.length > 180) {
    throw new DomainError('Journal asset file name is too long.');
  }

  return normalizedValue;
}

function normalizeContentType(value: string): TripJournalAssetContentType {
  const normalizedValue = value.trim().toLowerCase();

  if (!isSupportedJournalAssetContentType(normalizedValue)) {
    throw new DomainError('Journal asset must be a supported image file.');
  }

  return normalizedValue;
}

function normalizeByteSize(value: number): number {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_TRIP_JOURNAL_ASSET_BYTES
  ) {
    throw new DomainError(
      `Journal asset must be between 1 byte and ${MAX_TRIP_JOURNAL_ASSET_BYTES} bytes.`,
    );
  }

  return value;
}

function ensureDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be a valid date.`);
  }

  return value;
}
