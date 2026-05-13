import { Inject, Injectable } from '@nestjs/common';

import {
  journalRevisionNotFoundException,
  tripNotFoundException,
} from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { Trip } from '../../../trips/domain/trip';
import { TripJournal } from '../../domain/trip-journal';
import {
  TRIP_JOURNAL_REPOSITORY,
  type TripJournalRepositoryPort,
} from '../ports/trip-journal-repository.port';
import {
  TRIP_JOURNAL_REVISION_REPOSITORY,
  type TripJournalRevisionRepositoryPort,
} from '../ports/trip-journal-revision-repository.port';
import { rethrowJournalDomainError } from './map-journal-domain-error';
import { TripJournalRevision } from '../../domain/trip-journal-revision';

export interface RestoreTripJournalRevisionInput {
  userId: string;
  tripId: string;
  revisionId: string;
}

export interface RestoreTripJournalRevisionResult {
  trip: Trip;
  journal: TripJournal;
}

@Injectable()
export class RestoreTripJournalRevisionService
  implements
    UseCase<
      RestoreTripJournalRevisionInput,
      RestoreTripJournalRevisionResult
    >
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REPOSITORY)
    private readonly journalRepository: TripJournalRepositoryPort,
    @Inject(TRIP_JOURNAL_REVISION_REPOSITORY)
    private readonly revisionRepository: TripJournalRevisionRepositoryPort,
  ) {}

  async execute(
    input: RestoreTripJournalRevisionInput,
  ): Promise<RestoreTripJournalRevisionResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    const revision = await this.revisionRepository.findByIdForTrip(
      trip.id,
      input.revisionId,
    );

    if (revision === null) {
      throw journalRevisionNotFoundException();
    }

    try {
      const savedJournal = await this.journalRepository.upsert(
        TripJournal.create({
          tripId: trip.id,
          sceneVersion: revision.sceneVersion,
          page: revision.page,
          objects: revision.objects,
        }),
      );

      await this.revisionRepository.create(
        TripJournalRevision.fromJournal(savedJournal),
      );

      return {
        trip,
        journal: savedJournal,
      };
    } catch (error) {
      rethrowJournalDomainError(error);
    }
  }
}
