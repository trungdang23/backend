import { Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { Trip } from '../../../trips/domain/trip';
import type { TripJournalAsset } from '../../domain/trip-journal-asset';
import {
  TRIP_JOURNAL_ASSET_REPOSITORY,
  type TripJournalAssetRepositoryPort,
} from '../ports/trip-journal-asset-repository.port';

export interface ListTripJournalAssetsInput {
  userId: string;
  tripId: string;
}

export interface ListTripJournalAssetsResult {
  trip: Trip;
  assets: TripJournalAsset[];
}

@Injectable()
export class ListTripJournalAssetsService implements UseCase<
  ListTripJournalAssetsInput,
  ListTripJournalAssetsResult
> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_ASSET_REPOSITORY)
    private readonly assetRepository: TripJournalAssetRepositoryPort,
  ) {}

  async execute(
    input: ListTripJournalAssetsInput,
  ): Promise<ListTripJournalAssetsResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    return {
      trip,
      assets: await this.assetRepository.listByTripForUser({
        tripId: trip.id,
        userId: input.userId,
      }),
    };
  }
}
