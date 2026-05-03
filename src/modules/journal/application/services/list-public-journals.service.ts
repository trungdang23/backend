import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import {
  TRIP_JOURNAL_REPOSITORY,
  type TripJournalRepositoryPort,
} from '../ports/trip-journal-repository.port';
import type { TripJournalResult } from './get-trip-journal.service';

@Injectable()
export class ListPublicJournalsService
  implements UseCase<void, TripJournalResult[]>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_REPOSITORY)
    private readonly journalRepository: TripJournalRepositoryPort,
  ) {}

  async execute(): Promise<TripJournalResult[]> {
    const journals = await this.journalRepository.listPublic();
    const results: TripJournalResult[] = [];

    for (const journal of journals) {
      const trip = await this.tripRepository.findById(journal.tripId);

      if (trip !== null) {
        results.push({
          trip,
          journal,
        });
      }
    }

    return results;
  }
}
