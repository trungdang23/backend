import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Trip } from '../../domain/trip';
import { TRIP_BUDGET_MODES } from '../../domain/trip-budget-mode';
import { TRIP_VISIBILITIES } from '../../domain/trip-visibility';

export class TripResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  destination!: string | null;

  @ApiPropertyOptional({ nullable: true })
  summaryNotes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiPropertyOptional({ nullable: true })
  timezone!: string | null;

  @ApiProperty()
  budgetAmount!: number;

  @ApiProperty()
  budgetCurrency!: string;

  @ApiProperty({ enum: TRIP_BUDGET_MODES })
  budgetMode!: string;

  @ApiPropertyOptional({ nullable: true })
  manualBudgetAmount!: number | null;

  @ApiPropertyOptional({ nullable: true })
  manualBudgetCurrency!: string | null;

  @ApiProperty({ enum: TRIP_VISIBILITIES })
  visibility!: string;

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
      budgetMode: trip.budgetMode,
      manualBudgetAmount: trip.manualBudgetAmount,
      manualBudgetCurrency: trip.manualBudgetCurrency,
      visibility: trip.visibility,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }
}
