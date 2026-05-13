import { Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import type { TripJournalRevision } from '../../domain/trip-journal-revision';
import {
  TRIP_JOURNAL_REVISION_REPOSITORY,
  type TripJournalRevisionRepositoryPort,
} from '../ports/trip-journal-revision-repository.port';

export interface ListTripJournalRevisionsInput {
  userId: string;
  tripId: string;
}

@Injectable()
export class ListTripJournalRevisionsService
  implements UseCase<ListTripJournalRevisionsInput, TripJournalRevision[]>
{
  static readonly DEFAULT_LIMIT = 12;

  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REVISION_REPOSITORY)
    private readonly revisionRepository: TripJournalRevisionRepositoryPort,
  ) {}

  async execute(
    input: ListTripJournalRevisionsInput,
  ): Promise<TripJournalRevision[]> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    return this.revisionRepository.listByTripId(
      trip.id,
      ListTripJournalRevisionsService.DEFAULT_LIMIT,
    );
  }
}
