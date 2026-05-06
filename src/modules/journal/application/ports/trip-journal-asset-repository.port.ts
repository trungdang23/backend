import type { TripJournalAsset } from '../../domain/trip-journal-asset';

export const TRIP_JOURNAL_ASSET_REPOSITORY = Symbol(
  'TRIP_JOURNAL_ASSET_REPOSITORY',
);

export interface TripJournalAssetRepositoryPort {
  create(asset: TripJournalAsset): Promise<TripJournalAsset>;
  findByPublicId(publicId: string): Promise<TripJournalAsset | null>;
}
