import type { TripJournalAsset } from '../../domain/trip-journal-asset';

export const TRIP_JOURNAL_ASSET_REPOSITORY = Symbol(
  'TRIP_JOURNAL_ASSET_REPOSITORY',
);

export interface FindTripJournalAssetForUserInput {
  assetId: string;
  tripId: string;
  userId: string;
}

export interface ListTripJournalAssetsForUserInput {
  tripId: string;
  userId: string;
}

export interface TripJournalAssetRepositoryPort {
  create(asset: TripJournalAsset): Promise<TripJournalAsset>;
  findByPublicId(publicId: string): Promise<TripJournalAsset | null>;
  findByIdForUser(
    input: FindTripJournalAssetForUserInput,
  ): Promise<TripJournalAsset | null>;
  listByTripId(tripId: string): Promise<TripJournalAsset[]>;
  listByTripForUser(
    input: ListTripJournalAssetsForUserInput,
  ): Promise<TripJournalAsset[]>;
  deleteByIdForUser(input: FindTripJournalAssetForUserInput): Promise<boolean>;
}
