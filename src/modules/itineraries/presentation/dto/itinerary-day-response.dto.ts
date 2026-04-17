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

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  startsAt!: string | null;

  @ApiProperty({ nullable: true })
  endsAt!: string | null;

  @ApiProperty({ nullable: true })
  location!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  costAmount!: number;

  @ApiProperty()
  costCurrency!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty({ type: [String] })
  imageUrls!: string[];

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
      title: day.title,
      startsAt: day.startsAt,
      endsAt: day.endsAt,
      location: day.location,
      notes: day.notes,
      costAmount: day.costAmount,
      costCurrency: day.costCurrency,
      position: day.position,
      imageUrls: day.imageUrls,
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
