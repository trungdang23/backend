import type { TripJournalRevisionRepositoryPort } from '../../src/modules/journal/application/ports/trip-journal-revision-repository.port';
import { TripJournalRevision } from '../../src/modules/journal/domain/trip-journal-revision';

export class InMemoryTripJournalRevisionRepository
  implements TripJournalRevisionRepositoryPort
{
  private readonly revisionsByTripId = new Map<string, TripJournalRevision[]>();
  private nextId = 1;

  create(revision: TripJournalRevision): Promise<TripJournalRevision> {
    const createdRevision = TripJournalRevision.create({
      id: revision.id ?? `journal-revision-${this.nextId++}`,
      tripId: revision.tripId,
      sceneVersion: revision.sceneVersion,
      page: revision.page,
      objects: revision.objects,
      createdAt: new Date(),
    });

    const existingRevisions = this.revisionsByTripId.get(revision.tripId) ?? [];
    this.revisionsByTripId.set(revision.tripId, [
      createdRevision,
      ...existingRevisions,
    ]);

    return Promise.resolve(createdRevision);
  }

  findByIdForTrip(
    tripId: string,
    revisionId: string,
  ): Promise<TripJournalRevision | null> {
    const revision =
      this.revisionsByTripId
        .get(tripId)
        ?.find((item) => item.id === revisionId) ?? null;

    return Promise.resolve(revision);
  }

  listByTripId(tripId: string, limit: number): Promise<TripJournalRevision[]> {
    return Promise.resolve(
      (this.revisionsByTripId.get(tripId) ?? []).slice(0, limit),
    );
  }

  deleteByTripId(tripId: string): Promise<number> {
    const deletedCount = this.revisionsByTripId.get(tripId)?.length ?? 0;
    this.revisionsByTripId.delete(tripId);

    return Promise.resolve(deletedCount);
  }

  clear(): void {
    this.revisionsByTripId.clear();
    this.nextId = 1;
  }
}
