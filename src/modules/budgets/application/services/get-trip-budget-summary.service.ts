import { Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  PLAN_NODE_REPOSITORY,
  type PlanNodeRepositoryPort,
} from '../../../planning/application/ports/plan-node-repository.port';
import type { Trip } from '../../../trips/domain/trip';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import {
  TripBudgetSummary,
  type TripBudgetSummaryCurrencyTotal,
} from '../../domain/trip-budget-summary';

export interface GetTripBudgetSummaryInput {
  userId: string;
  tripId: string;
}

@Injectable()
export class GetTripBudgetSummaryService implements UseCase<
  GetTripBudgetSummaryInput,
  TripBudgetSummary
> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
  ) {}

  async execute(input: GetTripBudgetSummaryInput): Promise<TripBudgetSummary> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    const planNodes = await this.planNodeRepository.listByTrip({
      tripId: trip.id,
    });
    const totalDays = planNodes.filter((node) => node.type === 'day').length;
    const totalActivities = planNodes.filter(
      (node) => node.type === 'activity',
    ).length;
    const rawTotalsByCurrency = buildTotalsByCurrency(planNodes);
    const displayCurrency = resolveDisplayCurrency(trip, rawTotalsByCurrency);
    const totalsByCurrency = sortTotalsByCurrency(
      rawTotalsByCurrency,
      displayCurrency,
    );
    const totalPlannedAmount =
      totalsByCurrency.find((total) => total.currency === displayCurrency)
        ?.plannedAmount ?? 0;
    const totalBudgetAmount =
      trip.budgetMode === 'manual'
        ? (trip.manualBudgetAmount ?? trip.budgetAmount)
        : totalPlannedAmount;
    const hasMixedCurrencies = totalsByCurrency.some(
      (total) => total.currency !== displayCurrency,
    );

    return TripBudgetSummary.create({
      tripId: trip.id,
      currency: displayCurrency,
      totalBudgetAmount,
      totalPlannedAmount,
      totalDays,
      totalActivities,
      hasMixedCurrencies,
      totalsByCurrency,
    });
  }
}

function buildTotalsByCurrency(
  nodes: Awaited<ReturnType<PlanNodeRepositoryPort['listByTrip']>>,
): TripBudgetSummaryCurrencyTotal[] {
  const totals = new Map<string, TripBudgetSummaryCurrencyTotal>();

  for (const node of nodes) {
    if (node.costAmount === null || node.costCurrency === null) {
      continue;
    }

    const currentTotal = totals.get(node.costCurrency) ?? {
      currency: node.costCurrency,
      plannedAmount: 0,
      nodeCount: 0,
    };

    currentTotal.plannedAmount += node.costAmount;
    currentTotal.nodeCount += 1;
    totals.set(node.costCurrency, currentTotal);
  }

  return Array.from(totals.values()).sort((left, right) =>
    left.currency.localeCompare(right.currency),
  );
}

function resolveDisplayCurrency(
  trip: Trip,
  totalsByCurrency: TripBudgetSummaryCurrencyTotal[],
): string {
  if (trip.budgetMode === 'manual' && trip.manualBudgetCurrency !== null) {
    return trip.manualBudgetCurrency;
  }

  if (totalsByCurrency.length === 1) {
    return totalsByCurrency[0].currency;
  }

  const compatibilityCurrencyTotal = totalsByCurrency.find(
    (total) => total.currency === trip.budgetCurrency,
  );

  if (compatibilityCurrencyTotal !== undefined) {
    return compatibilityCurrencyTotal.currency;
  }

  return totalsByCurrency[0]?.currency ?? trip.budgetCurrency;
}

function sortTotalsByCurrency(
  totalsByCurrency: TripBudgetSummaryCurrencyTotal[],
  displayCurrency: string,
): TripBudgetSummaryCurrencyTotal[] {
  return [...totalsByCurrency].sort((left, right) => {
    if (
      left.currency === displayCurrency &&
      right.currency !== displayCurrency
    ) {
      return -1;
    }

    if (
      right.currency === displayCurrency &&
      left.currency !== displayCurrency
    ) {
      return 1;
    }

    return left.currency.localeCompare(right.currency);
  });
}
