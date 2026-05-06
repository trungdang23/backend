import type { TripJournalAsset } from '../../domain/trip-journal-asset';

export interface TripJournalAssetDto {
  id: string | null;
  tripId: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  url: string;
  createdAt: string;
}

export interface TripJournalAssetUploadResponseDto {
  asset: TripJournalAssetDto;
}

export class TripJournalAssetResponseDto {
  static from(asset: TripJournalAsset): TripJournalAssetUploadResponseDto {
    return {
      asset: {
        id: asset.id,
        tripId: asset.tripId,
        fileName: asset.fileName,
        contentType: asset.contentType,
        byteSize: asset.byteSize,
        url: `/journal-assets/${asset.publicId}`,
        createdAt: asset.createdAt.toISOString(),
      },
    };
  }
}
