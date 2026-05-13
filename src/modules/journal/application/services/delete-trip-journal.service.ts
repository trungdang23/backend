import { Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import {
  TRIP_JOURNAL_REPOSITORY,
  type TripJournalRepositoryPort,
} from '../ports/trip-journal-repository.port';
import {
  TRIP_JOURNAL_REVISION_REPOSITORY,
  type TripJournalRevisionRepositoryPort,
} from '../ports/trip-journal-revision-repository.port';

export interface DeleteTripJournalInput {
  userId: string;
  tripId: string;
}

@Injectable()
export class DeleteTripJournalService
  implements UseCase<DeleteTripJournalInput, void>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REPOSITORY)
    private readonly journalRepository: TripJournalRepositoryPort,
    @Inject(TRIP_JOURNAL_REVISION_REPOSITORY)
    private readonly revisionRepository: TripJournalRevisionRepositoryPort,
  ) {}

  async execute(input: DeleteTripJournalInput): Promise<void> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    await this.journalRepository.deleteByTripId(trip.id);
    await this.revisionRepository.deleteByTripId(trip.id);
  }
}
