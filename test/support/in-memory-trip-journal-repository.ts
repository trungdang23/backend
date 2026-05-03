import type { TripJournalRepositoryPort } from '../../src/modules/journal/application/ports/trip-journal-repository.port';
import { TripJournal } from '../../src/modules/journal/domain/trip-journal';

export class InMemoryTripJournalRepository
  implements TripJournalRepositoryPort
{
  private readonly journalsByTripId = new Map<string, TripJournal>();

  findByTripId(tripId: string): Promise<TripJournal | null> {
    return Promise.resolve(this.journalsByTripId.get(tripId) ?? null);
  }

  upsert(journal: TripJournal): Promise<TripJournal> {
    const existingJournal = this.journalsByTripId.get(journal.tripId);
    const now = new Date();
    const savedJournal = TripJournal.create({
      id:
        existingJournal?.id ??
        journal.id ??
        `journal-${this.journalsByTripId.size + 1}`,
      tripId: journal.tripId,
      sceneVersion: journal.sceneVersion,
      page: journal.page,
      objects: journal.objects,
      createdAt: existingJournal?.createdAt ?? journal.createdAt,
      updatedAt: now,
    });

    this.journalsByTripId.set(savedJournal.tripId, savedJournal);

    return Promise.resolve(savedJournal);
  }

  clear(): void {
    this.journalsByTripId.clear();
  }
}
