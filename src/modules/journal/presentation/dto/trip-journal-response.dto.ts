import { ApiProperty } from '@nestjs/swagger';

import type { TripJournalResult } from '../../application/services/get-trip-journal.service';
import { TripResponseDto } from '../../../trips/presentation/dto/trip-response.dto';
import type { JournalPage, JournalSceneObject } from '../../domain/trip-journal';
import { TripJournal } from '../../domain/trip-journal';

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
      createdAt: journal.createdAt.toISOString(),
      updatedAt: journal.updatedAt.toISOString(),
    };
  }
}

class TripJournalPayloadDto {
  @ApiProperty({ type: TripResponseDto })
  trip!: TripResponseDto;

  @ApiProperty({ type: TripJournalDto })
  journal!: TripJournalDto;
}

export class TripJournalResponseDto {
  @ApiProperty({ type: TripJournalPayloadDto })
  data!: TripJournalPayloadDto;

  static from(result: TripJournalResult): TripJournalPayloadDto {
    return {
      trip: TripResponseDto.from(result.trip),
      journal: TripJournalDto.from(result.journal),
    };
  }
}
