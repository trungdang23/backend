import type { TripJournalAssetContentType } from '../../domain/trip-journal-asset';

export const JOURNAL_ASSET_STORAGE = Symbol('JOURNAL_ASSET_STORAGE');

export interface SaveJournalAssetFileInput {
  buffer: Buffer;
  contentType: TripJournalAssetContentType;
  publicId: string;
}

export interface SavedJournalAssetFile {
  storageKey: string;
}

export interface JournalAssetFile {
  byteSize: number;
  stream: NodeJS.ReadableStream;
}

export interface JournalAssetStoragePort {
  save(input: SaveJournalAssetFileInput): Promise<SavedJournalAssetFile>;
  read(storageKey: string): Promise<JournalAssetFile | null>;
}
