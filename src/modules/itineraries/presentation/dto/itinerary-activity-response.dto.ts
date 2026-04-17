import { ApiProperty } from '@nestjs/swagger';

import { ItineraryActivity } from '../../domain/itinerary-activity';

export class ItineraryActivityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  itineraryDayId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  startsAt!: string | null;

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

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(activity: ItineraryActivity): ItineraryActivityResponseDto {
    return {
      id: activity.id,
      itineraryDayId: activity.itineraryDayId,
      title: activity.title,
      startsAt: activity.startsAt,
      location: activity.location,
      notes: activity.notes,
      costAmount: activity.costAmount,
      costCurrency: activity.costCurrency,
      position: activity.position,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }
}
