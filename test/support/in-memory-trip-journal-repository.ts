import type { TripJournalRepositoryPort } from '../../src/modules/journal/application/ports/trip-journal-repository.port';
import { TripJournal } from '../../src/modules/journal/domain/trip-journal';

export class InMemoryTripJournalRepository
  implements TripJournalRepositoryPort
{
  private readonly journalsByTripId = new Map<string, TripJournal>();

  findByTripId(tripId: string): Promise<TripJournal | null> {
    return Promise.resolve(this.journalsByTripId.get(tripId) ?? null);
  }

  listByUserId(userId: string): Promise<TripJournal[]> {
    void userId;

    return Promise.resolve(
      Array.from(this.journalsByTripId.values()).sort(
        (left, right) =>
          right.updatedAt.getTime() - left.updatedAt.getTime() ||
          (left.id ?? '').localeCompare(right.id ?? ''),
      ),
    );
  }

  listPublic(): Promise<TripJournal[]> {
    return Promise.resolve(
      Array.from(this.journalsByTripId.values())
        .filter((journal) => journal.visibility === 'public')
        .sort(
          (left, right) =>
            right.updatedAt.getTime() - left.updatedAt.getTime() ||
            (left.id ?? '').localeCompare(right.id ?? ''),
        ),
    );
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
      visibility: existingJournal?.visibility ?? journal.visibility,
      createdAt: existingJournal?.createdAt ?? journal.createdAt,
      updatedAt: now,
    });

    this.journalsByTripId.set(savedJournal.tripId, savedJournal);

    return Promise.resolve(savedJournal);
  }

  updateVisibilityByTripId(
    tripId: string,
    visibility: string,
  ): Promise<TripJournal> {
    const existingJournal = this.journalsByTripId.get(tripId);
    const now = new Date();
    const savedJournal = TripJournal.create({
      id:
        existingJournal?.id ??
        `journal-${this.journalsByTripId.size + 1}`,
      tripId,
      sceneVersion: existingJournal?.sceneVersion,
      page: existingJournal?.page,
      objects: existingJournal?.objects,
      visibility,
      createdAt: existingJournal?.createdAt ?? now,
      updatedAt: now,
    });

    this.journalsByTripId.set(tripId, savedJournal);

    return Promise.resolve(savedJournal);
  }

  deleteByTripId(tripId: string): Promise<boolean> {
    const didDelete = this.journalsByTripId.delete(tripId);

    return Promise.resolve(didDelete);
  }

  clear(): void {
    this.journalsByTripId.clear();
  }
}
