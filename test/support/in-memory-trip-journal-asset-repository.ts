import type { TripJournalAssetRepositoryPort } from '../../src/modules/journal/application/ports/trip-journal-asset-repository.port';
import { TripJournalAsset } from '../../src/modules/journal/domain/trip-journal-asset';

export class InMemoryTripJournalAssetRepository
  implements TripJournalAssetRepositoryPort
{
  private readonly assetsByPublicId = new Map<string, TripJournalAsset>();

  create(asset: TripJournalAsset): Promise<TripJournalAsset> {
    const savedAsset = TripJournalAsset.create({
      id: asset.id ?? `journal-asset-${this.assetsByPublicId.size + 1}`,
      tripId: asset.tripId,
      userId: asset.userId,
      fileName: asset.fileName,
      contentType: asset.contentType,
      byteSize: asset.byteSize,
      storageKey: asset.storageKey,
      publicId: asset.publicId,
      createdAt: asset.createdAt,
    });

    this.assetsByPublicId.set(savedAsset.publicId, savedAsset);

    return Promise.resolve(savedAsset);
  }

  findByPublicId(publicId: string): Promise<TripJournalAsset | null> {
    return Promise.resolve(this.assetsByPublicId.get(publicId) ?? null);
  }

  clear(): void {
    this.assetsByPublicId.clear();
  }
}
