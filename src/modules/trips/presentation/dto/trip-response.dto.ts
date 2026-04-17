import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Trip } from '../../domain/trip';

export class TripResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  destination!: string;

  @ApiPropertyOptional({ nullable: true })
  summaryNotes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  timezone!: string;

  @ApiProperty()
  budgetAmount!: number;

  @ApiProperty()
  budgetCurrency!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(trip: Trip): TripResponseDto {
    return {
      id: trip.id,
      userId: trip.userId,
      name: trip.name,
      destination: trip.destination,
      summaryNotes: trip.summaryNotes,
      coverImageUrl: trip.coverImageUrl,
      startDate: trip.startDate,
      endDate: trip.endDate,
      timezone: trip.timezone,
      budgetAmount: trip.budgetAmount,
      budgetCurrency: trip.budgetCurrency,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }
}
