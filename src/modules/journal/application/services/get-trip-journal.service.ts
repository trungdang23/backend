import { Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
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

export interface GetTripJournalInput {
  userId: string;
  tripId: string;
}

export interface TripJournalResult {
  trip: Trip;
  journal: TripJournal;
}

@Injectable()
export class GetTripJournalService
  implements UseCase<GetTripJournalInput, TripJournalResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REPOSITORY)
    private readonly journalRepository: TripJournalRepositoryPort,
  ) {}

  async execute(input: GetTripJournalInput): Promise<TripJournalResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    const journal =
      (await this.journalRepository.findByTripId(trip.id)) ??
      TripJournal.createEmpty({
        tripId: trip.id,
      });

    return {
      trip,
      journal,
    };
  }
}
