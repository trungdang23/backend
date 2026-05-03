import type { TripJournal } from '../../domain/trip-journal';

export const TRIP_JOURNAL_REPOSITORY = Symbol('TRIP_JOURNAL_REPOSITORY');

export interface TripJournalRepositoryPort {
  findByTripId(tripId: string): Promise<TripJournal | null>;
  upsert(journal: TripJournal): Promise<TripJournal>;
}
