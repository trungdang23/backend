import { ApiProperty } from '@nestjs/swagger';

import {
  TripBudgetSummary,
  type TripBudgetSummaryCurrencyTotal,
} from '../../domain/trip-budget-summary';

export class BudgetSummaryCurrencyTotalResponseDto {
  @ApiProperty()
  currency!: string;

  @ApiProperty()
  plannedAmount!: number;

  @ApiProperty()
  nodeCount!: number;

  static from(
    total: TripBudgetSummaryCurrencyTotal,
  ): BudgetSummaryCurrencyTotalResponseDto {
    return {
      currency: total.currency,
      plannedAmount: total.plannedAmount,
      nodeCount: total.nodeCount,
    };
  }
}

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

  @ApiProperty()
  hasMixedCurrencies!: boolean;

  @ApiProperty({ type: () => [BudgetSummaryCurrencyTotalResponseDto] })
  totalsByCurrency!: BudgetSummaryCurrencyTotalResponseDto[];

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
      hasMixedCurrencies: summary.hasMixedCurrencies,
      totalsByCurrency: summary.totalsByCurrency.map((total) =>
        BudgetSummaryCurrencyTotalResponseDto.from(total),
      ),
    };
  }
}
