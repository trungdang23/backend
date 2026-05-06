import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import {
  journalValidationException,
  tripNotFoundException,
} from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { Trip } from '../../../trips/domain/trip';
import {
  isSupportedJournalAssetContentType,
  TripJournalAsset,
} from '../../domain/trip-journal-asset';
import {
  JOURNAL_ASSET_STORAGE,
  type JournalAssetStoragePort,
} from '../ports/journal-asset-storage.port';
import {
  TRIP_JOURNAL_ASSET_REPOSITORY,
  type TripJournalAssetRepositoryPort,
} from '../ports/trip-journal-asset-repository.port';
import { rethrowJournalDomainError } from './map-journal-domain-error';

export interface UploadedTripJournalAssetFile {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  byteSize: number;
}

export interface UploadTripJournalAssetInput {
  userId: string;
  tripId: string;
  file: UploadedTripJournalAssetFile | null;
}

export interface UploadTripJournalAssetResult {
  trip: Trip;
  asset: TripJournalAsset;
}

@Injectable()
export class UploadTripJournalAssetService
  implements UseCase<UploadTripJournalAssetInput, UploadTripJournalAssetResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(TRIP_JOURNAL_ASSET_REPOSITORY)
    private readonly assetRepository: TripJournalAssetRepositoryPort,
    @Inject(JOURNAL_ASSET_STORAGE)
    private readonly assetStorage: JournalAssetStoragePort,
  ) {}

  async execute(
    input: UploadTripJournalAssetInput,
  ): Promise<UploadTripJournalAssetResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    if (input.file === null) {
      throw journalValidationException('Journal asset file is required.');
    }

    const contentType = input.file.contentType.trim().toLowerCase();

    if (!isSupportedJournalAssetContentType(contentType)) {
      throw journalValidationException(
        'Journal asset must be a supported image file.',
      );
    }

    try {
      const publicId = randomUUID();
      const savedFile = await this.assetStorage.save({
        buffer: input.file.buffer,
        contentType,
        publicId,
      });
      const asset = TripJournalAsset.create({
        tripId: trip.id,
        userId: input.userId,
        fileName: input.file.fileName,
        contentType,
        byteSize: input.file.byteSize,
        storageKey: savedFile.storageKey,
        publicId,
      });

      return {
        trip,
        asset: await this.assetRepository.create(asset),
      };
    } catch (error) {
      rethrowJournalDomainError(error);
    }
  }
}
