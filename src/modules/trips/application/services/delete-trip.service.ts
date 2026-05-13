import { unlink } from 'node:fs/promises';

import { Inject, Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../../app/config/app-config.service';
import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import { resolveJournalAssetFilePath } from '../../../journal/infrastructure/storage/journal-asset-storage-path';
import { Trip } from '../../domain/trip';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../ports/trip-repository.port';

export interface DeleteTripInput {
  userId: string;
  tripId: string;
}

@Injectable()
export class DeleteTripService implements UseCase<DeleteTripInput, Trip> {
  constructor(
    private readonly config: AppConfigService,
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: DeleteTripInput): Promise<Trip> {
    const existingTrip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (existingTrip === null) {
      throw tripNotFoundException();
    }

    // Snapshot storage keys before deleting the trip because DB cascade removes
    // the asset rows that would otherwise point to the on-disk files.
    const journalAssetStorageKeys =
      await this.tripRepository.listJournalAssetStorageKeysByTripIdForUser({
        tripId: existingTrip.id,
        userId: existingTrip.userId,
      });

    const trip = await this.tripRepository.delete({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    await this.deleteJournalAssetFilesBestEffort(journalAssetStorageKeys);

    return trip;
  }

  private async deleteJournalAssetFilesBestEffort(
    storageKeys: string[],
  ): Promise<void> {
    for (const storageKey of storageKeys) {
      try {
        await unlink(resolveJournalAssetFilePath(this.config, storageKey));
      } catch {
        // Trip deletion should not fail after the DB state is already gone.
      }
    }
  }
}
