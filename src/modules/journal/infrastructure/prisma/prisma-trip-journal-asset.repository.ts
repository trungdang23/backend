import { Injectable } from '@nestjs/common';
import type {
  TripJournalAsset as PrismaTripJournalAsset,
} from '@prisma/client';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { TripJournalAssetRepositoryPort } from '../../application/ports/trip-journal-asset-repository.port';
import { TripJournalAsset } from '../../domain/trip-journal-asset';

@Injectable()
export class PrismaTripJournalAssetRepository
  implements TripJournalAssetRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(asset: TripJournalAsset): Promise<TripJournalAsset> {
    const record = await this.prisma.tripJournalAsset.create({
      data: {
        tripId: asset.tripId,
        userId: asset.userId,
        fileName: asset.fileName,
        contentType: asset.contentType,
        byteSize: asset.byteSize,
        storageKey: asset.storageKey,
        publicId: asset.publicId,
      },
    });

    return toTripJournalAsset(record);
  }

  async findByPublicId(publicId: string): Promise<TripJournalAsset | null> {
    const record = await this.prisma.tripJournalAsset.findUnique({
      where: {
        publicId,
      },
    });

    return record === null ? null : toTripJournalAsset(record);
  }
}

function toTripJournalAsset(
  record: PrismaTripJournalAsset,
): TripJournalAsset {
  return TripJournalAsset.create({
    id: record.id,
    tripId: record.tripId,
    userId: record.userId,
    fileName: record.fileName,
    contentType: record.contentType,
    byteSize: record.byteSize,
    storageKey: record.storageKey,
    publicId: record.publicId,
    createdAt: record.createdAt,
  });
}
