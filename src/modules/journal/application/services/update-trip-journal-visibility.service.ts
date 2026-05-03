import { Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { normalizeJournalVisibility } from '../../domain/journal-visibility';
import {
  TRIP_JOURNAL_REPOSITORY,
  type TripJournalRepositoryPort,
} from '../ports/trip-journal-repository.port';
import type { TripJournalResult } from './get-trip-journal.service';
import { rethrowJournalDomainError } from './map-journal-domain-error';

export interface UpdateTripJournalVisibilityInput {
  userId: string;
  tripId: string;
  visibility: string;
}

@Injectable()
export class UpdateTripJournalVisibilityService
  implements UseCase<UpdateTripJournalVisibilityInput, TripJournalResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REPOSITORY)
    private readonly journalRepository: TripJournalRepositoryPort,
  ) {}

  async execute(
    input: UpdateTripJournalVisibilityInput,
  ): Promise<TripJournalResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    try {
      const visibility = normalizeJournalVisibility(input.visibility);

      return {
        trip,
        journal: await this.journalRepository.updateVisibilityByTripId(
          trip.id,
          visibility,
        ),
      };
    } catch (error) {
      rethrowJournalDomainError(error);
    }
  }
}
