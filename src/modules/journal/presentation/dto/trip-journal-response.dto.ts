import { ApiProperty } from '@nestjs/swagger';

import type { TripJournalResult } from '../../application/services/get-trip-journal.service';
import { TripResponseDto } from '../../../trips/presentation/dto/trip-response.dto';
import type { TripAuthorSummary } from '../../../trips/application/services/trip-author-presenter.service';
import type { JournalPage, JournalSceneObject } from '../../domain/trip-journal';
import { TripJournal } from '../../domain/trip-journal';
import { JOURNAL_VISIBILITIES } from '../../domain/journal-visibility';

class JournalPageBackgroundDto {
  @ApiProperty()
  style!: string;
}

class JournalPageDto {
  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty({ type: JournalPageBackgroundDto })
  background!: JournalPageBackgroundDto;
}

class JournalSceneObjectDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  x!: number;

  @ApiProperty()
  y!: number;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty()
  rotation!: number;

  @ApiProperty()
  zIndex!: number;

  @ApiProperty()
  locked!: boolean;

  @ApiProperty({ type: Object })
  props!: Record<string, unknown>;
}

class TripJournalDto {
  @ApiProperty({ nullable: true })
  id!: string | null;

  @ApiProperty()
  tripId!: string;

  @ApiProperty()
  sceneVersion!: number;

  @ApiProperty({ type: JournalPageDto })
  page!: JournalPage;

  @ApiProperty({ type: [JournalSceneObjectDto] })
  objects!: JournalSceneObject[];

  @ApiProperty({ enum: JOURNAL_VISIBILITIES })
  visibility!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static from(journal: TripJournal): TripJournalDto {
    return {
      id: journal.id,
      tripId: journal.tripId,
      sceneVersion: journal.sceneVersion,
      page: journal.page,
      objects: journal.objects,
      visibility: journal.visibility,
      createdAt: journal.createdAt.toISOString(),
      updatedAt: journal.updatedAt.toISOString(),
    };
  }
}

export class TripJournalResponseDto {
  @ApiProperty({ type: TripResponseDto })
  trip!: TripResponseDto;

  @ApiProperty({ type: TripJournalDto })
  journal!: TripJournalDto;

  static from(
    result: TripJournalResult,
    author?: TripAuthorSummary,
  ): TripJournalResponseDto {
    return {
      trip: TripResponseDto.from(result.trip, author),
      journal: TripJournalDto.from(result.journal),
    };
  }
}

export class TripJournalListResponseDto {
  static from(
    results: TripJournalResult[],
    authorsByTripId = new Map<string, TripAuthorSummary>(),
  ): TripJournalResponseDto[] {
    return results.map((result) =>
      TripJournalResponseDto.from(
        result,
        authorsByTripId.get(result.trip.id),
      ),
    );
  }
}
