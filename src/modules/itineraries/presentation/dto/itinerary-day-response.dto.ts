import { ApiProperty } from '@nestjs/swagger';

import type { ItineraryDayAggregate } from '../../application/ports/itinerary-repository.port';
import { ItineraryDay } from '../../domain/itinerary-day';
import { ItineraryActivityResponseDto } from './itinerary-activity-response.dto';

export class ItineraryDayResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tripId!: string;

  @ApiProperty()
  date!: string;

  @ApiProperty({ type: [ItineraryActivityResponseDto] })
  activities!: ItineraryActivityResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromDay(
    day: ItineraryDay,
    activities: ItineraryActivityResponseDto[] = [],
  ): ItineraryDayResponseDto {
    return {
      id: day.id,
      tripId: day.tripId,
      date: day.date,
      activities,
      createdAt: day.createdAt,
      updatedAt: day.updatedAt,
    };
  }

  static fromAggregate(aggregate: ItineraryDayAggregate): ItineraryDayResponseDto {
    return ItineraryDayResponseDto.fromDay(
      aggregate.day,
      aggregate.activities.map((activity) =>
        ItineraryActivityResponseDto.from(activity),
      ),
    );
  }
}
