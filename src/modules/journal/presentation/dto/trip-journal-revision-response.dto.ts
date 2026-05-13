import { ApiProperty } from '@nestjs/swagger';

import type { TripJournalRevision } from '../../domain/trip-journal-revision';

export class TripJournalRevisionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tripId!: string;

  @ApiProperty()
  sceneVersion!: number;

  @ApiProperty()
  objectCount!: number;

  @ApiProperty()
  createdAt!: string;
}

export class TripJournalRevisionListResponseDto {
  @ApiProperty({ type: [TripJournalRevisionDto] })
  revisions!: TripJournalRevisionDto[];
}

export class TripJournalRevisionResponseDto {
  static list(
    revisions: TripJournalRevision[],
  ): TripJournalRevisionListResponseDto {
    return {
      revisions: revisions.map((revision) => ({
        id: revision.id ?? '',
        tripId: revision.tripId,
        sceneVersion: revision.sceneVersion,
        objectCount: revision.objectCount,
        createdAt: revision.createdAt.toISOString(),
      })),
    };
  }
}
