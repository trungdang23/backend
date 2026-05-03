import type { TripJournal } from '../../domain/trip-journal';

export const TRIP_JOURNAL_REPOSITORY = Symbol('TRIP_JOURNAL_REPOSITORY');

export interface TripJournalRepositoryPort {
  findByTripId(tripId: string): Promise<TripJournal | null>;
  listByUserId(userId: string): Promise<TripJournal[]>;
  listPublic(): Promise<TripJournal[]>;
  upsert(journal: TripJournal): Promise<TripJournal>;
  updateVisibilityByTripId(
    tripId: string,
    visibility: string,
  ): Promise<TripJournal>;
  deleteByTripId(tripId: string): Promise<boolean>;
}
