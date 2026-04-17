import { ApiProperty } from '@nestjs/swagger';

import { TripBudgetSummary } from '../../domain/trip-budget-summary';

export class BudgetSummaryResponseDto {
  @ApiProperty()
  tripId!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  totalBudgetAmount!: number;

  @ApiProperty()
  totalPlannedAmount!: number;

  @ApiProperty()
  remainingAmount!: number;

  @ApiProperty()
  totalDays!: number;

  @ApiProperty()
  totalActivities!: number;

  @ApiProperty()
  isOverBudget!: boolean;

  static from(summary: TripBudgetSummary): BudgetSummaryResponseDto {
    return {
      tripId: summary.tripId,
      currency: summary.currency,
      totalBudgetAmount: summary.totalBudgetAmount,
      totalPlannedAmount: summary.totalPlannedAmount,
      remainingAmount: summary.remainingAmount,
      totalDays: summary.totalDays,
      totalActivities: summary.totalActivities,
      isOverBudget: summary.isOverBudget,
    };
  }
}
