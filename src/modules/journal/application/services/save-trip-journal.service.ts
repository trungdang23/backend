import { Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { Trip } from '../../../trips/domain/trip';
import type { JournalPage, JournalSceneObject } from '../../domain/trip-journal';
import { TripJournal } from '../../domain/trip-journal';
import {
  TRIP_JOURNAL_REPOSITORY,
  type TripJournalRepositoryPort,
} from '../ports/trip-journal-repository.port';
import { rethrowJournalDomainError } from './map-journal-domain-error';

export interface SaveTripJournalInput {
  userId: string;
  tripId: string;
  sceneVersion: number;
  page: JournalPage;
  objects: JournalSceneObject[];
}

export interface SaveTripJournalResult {
  trip: Trip;
  journal: TripJournal;
}

@Injectable()
export class SaveTripJournalService
  implements UseCase<SaveTripJournalInput, SaveTripJournalResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REPOSITORY)
    private readonly journalRepository: TripJournalRepositoryPort,
  ) {}

  async execute(input: SaveTripJournalInput): Promise<SaveTripJournalResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    try {
      const journal = TripJournal.create({
        tripId: trip.id,
        sceneVersion: input.sceneVersion,
        page: input.page,
        objects: input.objects,
      });

      return {
        trip,
        journal: await this.journalRepository.upsert(journal),
      };
    } catch (error) {
      rethrowJournalDomainError(error);
    }
  }
}
