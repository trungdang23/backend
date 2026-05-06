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

export interface TripJournalAssetListResponseDto {
  assets: TripJournalAssetDto[];
}

export class TripJournalAssetResponseDto {
  static list(
    assets: TripJournalAsset[],
    buildUrl: (asset: TripJournalAsset) => string,
  ): TripJournalAssetListResponseDto {
    return {
      assets: assets.map((asset) => this.toDto(asset, buildUrl(asset))),
    };
  }

  static from(
    asset: TripJournalAsset,
    url: string,
  ): TripJournalAssetUploadResponseDto {
    return {
      asset: this.toDto(asset, url),
    };
  }

  private static toDto(asset: TripJournalAsset, url: string): TripJournalAssetDto {
    return {
      id: asset.id,
      tripId: asset.tripId,
      fileName: asset.fileName,
      contentType: asset.contentType,
      byteSize: asset.byteSize,
      url,
      createdAt: asset.createdAt.toISOString(),
    };
  }
}
