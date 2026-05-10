import { ApiProperty } from '@nestjs/swagger';

import type { TripJournalAsset } from '../../domain/trip-journal-asset';

export class TripJournalAssetDto {
  @ApiProperty({ nullable: true })
  id!: string | null;

  @ApiProperty()
  tripId!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  byteSize!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  createdAt!: string;
}

export class TripJournalAssetUploadResponseDto {
  @ApiProperty({ type: TripJournalAssetDto })
  asset!: TripJournalAssetDto;
}

export class TripJournalAssetListResponseDto {
  @ApiProperty({ type: [TripJournalAssetDto] })
  assets!: TripJournalAssetDto[];
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
