import type { TripJournalAssetRepositoryPort } from '../../src/modules/journal/application/ports/trip-journal-asset-repository.port';
import { TripJournalAsset } from '../../src/modules/journal/domain/trip-journal-asset';

export class InMemoryTripJournalAssetRepository implements TripJournalAssetRepositoryPort {
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

  findByIdForUser(input: {
    assetId: string;
    tripId: string;
    userId: string;
  }): Promise<TripJournalAsset | null> {
    const asset = Array.from(this.assetsByPublicId.values()).find(
      (candidate) =>
        candidate.id === input.assetId &&
        candidate.tripId === input.tripId &&
        candidate.userId === input.userId,
    );

    return Promise.resolve(asset ?? null);
  }

  listByTripId(tripId: string): Promise<TripJournalAsset[]> {
    const assets = Array.from(this.assetsByPublicId.values())
      .filter((asset) => asset.tripId === tripId)
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );

    return Promise.resolve(assets);
  }

  listByTripForUser(input: {
    tripId: string;
    userId: string;
  }): Promise<TripJournalAsset[]> {
    const assets = Array.from(this.assetsByPublicId.values())
      .filter(
        (asset) =>
          asset.tripId === input.tripId && asset.userId === input.userId,
      )
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );

    return Promise.resolve(assets);
  }

  deleteByIdForUser(input: {
    assetId: string;
    tripId: string;
    userId: string;
  }): Promise<boolean> {
    const asset = Array.from(this.assetsByPublicId.values()).find(
      (candidate) =>
        candidate.id === input.assetId &&
        candidate.tripId === input.tripId &&
        candidate.userId === input.userId,
    );

    if (asset === undefined) {
      return Promise.resolve(false);
    }

    return Promise.resolve(this.assetsByPublicId.delete(asset.publicId));
  }

  deleteByTripId(tripId: string): TripJournalAsset[] {
    const deletedAssets = Array.from(this.assetsByPublicId.values()).filter(
      (asset) => asset.tripId === tripId,
    );

    for (const asset of deletedAssets) {
      this.assetsByPublicId.delete(asset.publicId);
    }

    return deletedAssets;
  }

  clear(): void {
    this.assetsByPublicId.clear();
  }
}
