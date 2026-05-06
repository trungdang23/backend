import { Inject, Injectable } from '@nestjs/common';

import {
  journalAssetNotFoundException,
  tripNotFoundException,
} from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { Trip } from '../../../trips/domain/trip';
import type { TripJournalAsset } from '../../domain/trip-journal-asset';
import {
  JOURNAL_ASSET_STORAGE,
  type JournalAssetStoragePort,
} from '../ports/journal-asset-storage.port';
import {
  TRIP_JOURNAL_ASSET_REPOSITORY,
  type TripJournalAssetRepositoryPort,
} from '../ports/trip-journal-asset-repository.port';

export interface DeleteTripJournalAssetInput {
  userId: string;
  tripId: string;
  assetId: string;
}

export interface DeleteTripJournalAssetResult {
  trip: Trip;
  asset: TripJournalAsset;
}

@Injectable()
export class DeleteTripJournalAssetService implements UseCase<
  DeleteTripJournalAssetInput,
  DeleteTripJournalAssetResult
> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_ASSET_REPOSITORY)
    private readonly assetRepository: TripJournalAssetRepositoryPort,
    @Inject(JOURNAL_ASSET_STORAGE)
    private readonly assetStorage: JournalAssetStoragePort,
  ) {}

  async execute(
    input: DeleteTripJournalAssetInput,
  ): Promise<DeleteTripJournalAssetResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    const asset = await this.assetRepository.findByIdForUser({
      assetId: input.assetId,
      tripId: trip.id,
      userId: input.userId,
    });

    if (asset === null) {
      throw journalAssetNotFoundException();
    }

    const didDelete = await this.assetRepository.deleteByIdForUser({
      assetId: input.assetId,
      tripId: trip.id,
      userId: input.userId,
    });

    if (!didDelete) {
      throw journalAssetNotFoundException();
    }

    await this.assetStorage.delete(asset.storageKey);

    return {
      trip,
      asset,
    };
  }
}
