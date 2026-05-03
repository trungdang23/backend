import { Inject, Injectable } from '@nestjs/common';

import {
  permissionDeniedException,
  tripNotFoundException,
} from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { isJournalPubliclyReadable } from '../../domain/journal-visibility';
import {
  TRIP_JOURNAL_REPOSITORY,
  type TripJournalRepositoryPort,
} from '../ports/trip-journal-repository.port';
import type { TripJournalResult } from './get-trip-journal.service';

@Injectable()
export class GetPublicTripJournalService
  implements UseCase<string, TripJournalResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REPOSITORY)
    private readonly journalRepository: TripJournalRepositoryPort,
  ) {}

  async execute(tripId: string): Promise<TripJournalResult> {
    const trip = await this.tripRepository.findById(tripId);

    if (trip === null) {
      throw tripNotFoundException();
    }

    const journal = await this.journalRepository.findByTripId(trip.id);

    if (journal === null || !isJournalPubliclyReadable(journal.visibility)) {
      throw permissionDeniedException('Journal is private.');
    }

    return {
      trip,
      journal,
    };
  }
}
