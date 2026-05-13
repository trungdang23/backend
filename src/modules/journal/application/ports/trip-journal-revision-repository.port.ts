import type { TripJournalRevision } from '../../domain/trip-journal-revision';

export const TRIP_JOURNAL_REVISION_REPOSITORY = Symbol(
  'TRIP_JOURNAL_REVISION_REPOSITORY',
);

export interface TripJournalRevisionRepositoryPort {
  create(revision: TripJournalRevision): Promise<TripJournalRevision>;
  findByIdForTrip(
    tripId: string,
    revisionId: string,
  ): Promise<TripJournalRevision | null>;
  listByTripId(tripId: string, limit: number): Promise<TripJournalRevision[]>;
  deleteByTripId(tripId: string): Promise<number>;
}
