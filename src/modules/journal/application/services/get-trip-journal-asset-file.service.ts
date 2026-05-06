import { Inject, Injectable } from '@nestjs/common';

import { journalAssetNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import type { TripJournalAsset } from '../../domain/trip-journal-asset';
import {
  JOURNAL_ASSET_STORAGE,
  type JournalAssetFile,
  type JournalAssetStoragePort,
} from '../ports/journal-asset-storage.port';
import {
  TRIP_JOURNAL_ASSET_REPOSITORY,
  type TripJournalAssetRepositoryPort,
} from '../ports/trip-journal-asset-repository.port';

export interface GetTripJournalAssetFileResult {
  asset: TripJournalAsset;
  file: JournalAssetFile;
}

@Injectable()
export class GetTripJournalAssetFileService
  implements UseCase<string, GetTripJournalAssetFileResult>
{
  constructor(
    @Inject(TRIP_JOURNAL_ASSET_REPOSITORY)
    private readonly assetRepository: TripJournalAssetRepositoryPort,
    @Inject(JOURNAL_ASSET_STORAGE)
    private readonly assetStorage: JournalAssetStoragePort,
  ) {}

  async execute(publicId: string): Promise<GetTripJournalAssetFileResult> {
    const asset = await this.assetRepository.findByPublicId(publicId);

    if (asset === null) {
      throw journalAssetNotFoundException();
    }

    const file = await this.assetStorage.read(asset.storageKey);

    if (file === null) {
      throw journalAssetNotFoundException();
    }

    return {
      asset,
      file,
    };
  }
}
