import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import type { TripJournal } from '../../domain/trip-journal';
import {
  TRIP_JOURNAL_REPOSITORY,
  type TripJournalRepositoryPort,
} from '../ports/trip-journal-repository.port';
import type { TripJournalResult } from './get-trip-journal.service';

export interface ListUserJournalsInput {
  userId: string;
}

@Injectable()
export class ListUserJournalsService
  implements UseCase<ListUserJournalsInput, TripJournalResult[]>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REPOSITORY)
    private readonly journalRepository: TripJournalRepositoryPort,
  ) {}

  async execute(input: ListUserJournalsInput): Promise<TripJournalResult[]> {
    const journals = await this.journalRepository.listByUserId(input.userId);
    const results: TripJournalResult[] = [];

    for (const journal of journals) {
      const trip = await this.tripRepository.findById(journal.tripId);

      if (trip !== null && trip.userId === input.userId) {
        results.push({
          trip,
          journal: filterPersistedJournal(journal),
        });
      }
    }

    return results;
  }
}

function filterPersistedJournal(journal: TripJournal): TripJournal {
  return journal;
}
