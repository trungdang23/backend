import { NotFoundException } from '@nestjs/common';

import { GetTripBudgetSummaryService } from '../../../../../../src/modules/budgets/application/services/get-trip-budget-summary.service';
import type { PlanNodeRepositoryPort } from '../../../../../../src/modules/planning/application/ports/plan-node-repository.port';
import { PlanNode } from '../../../../../../src/modules/planning/domain/plan-node';
import type { TripRepositoryPort } from '../../../../../../src/modules/trips/application/ports/trip-repository.port';
import { Trip } from '../../../../../../src/modules/trips/domain/trip';

describe('GetTripBudgetSummaryService', () => {
  it('returns a planner-based manual budget summary and keeps mixed-currency details additive', async () => {
    const tripRepository = {
      findByIdForUser: jest.fn().mockResolvedValue(
        Trip.create({
          id: 'trip-01',
          userId: 'user-01',
          name: 'Hoi An Slow Days',
          startDate: '2026-07-12',
          endDate: '2026-07-15',
          budgetMode: 'manual',
          manualBudgetAmount: 5_000_000,
          manualBudgetCurrency: 'VND',
          visibility: 'private',
        }),
      ),
    } as unknown as TripRepositoryPort;
    const planNodeRepository = {
      listByTrip: jest.fn().mockResolvedValue([
        createPlanNode({
          id: 'node-day',
          type: 'day',
          title: 'Day 1',
          costAmount: 150_000,
          costCurrency: 'VND',
        }),
        createPlanNode({
          id: 'node-activity-vnd',
          parentId: 'node-day',
          type: 'activity',
          title: 'Coffee stop',
          depth: 1,
          costAmount: 200_000,
          costCurrency: 'VND',
        }),
        createPlanNode({
          id: 'node-activity-usd',
          parentId: 'node-day',
          type: 'activity',
          title: 'Ticket',
          depth: 1,
          costAmount: 25,
          costCurrency: 'USD',
          sortOrder: 1,
        }),
      ]),
    } as unknown as PlanNodeRepositoryPort;
    const service = new GetTripBudgetSummaryService(
      tripRepository,
      planNodeRepository,
    );

    await expect(
      service.execute({
        userId: 'user-01',
        tripId: 'trip-01',
      }),
    ).resolves.toMatchObject({
      tripId: 'trip-01',
      currency: 'VND',
      totalBudgetAmount: 5_000_000,
      totalPlannedAmount: 350_000,
      remainingAmount: 4_650_000,
      totalDays: 1,
      totalActivities: 2,
      isOverBudget: false,
      hasMixedCurrencies: true,
      totalsByCurrency: [
        {
          currency: 'VND',
          plannedAmount: 350_000,
          nodeCount: 2,
        },
        {
          currency: 'USD',
          plannedAmount: 25,
          nodeCount: 1,
        },
      ],
    });
  });

  it('uses the planner currency itself for auto mode when there is only one planned currency', async () => {
    const tripRepository = {
      findByIdForUser: jest.fn().mockResolvedValue(
        Trip.create({
          id: 'trip-02',
          userId: 'user-02',
          name: 'Seoul Short Trip',
          startDate: '2026-10-01',
          endDate: '2026-10-03',
          budgetMode: 'auto',
          visibility: 'private',
        }),
      ),
    } as unknown as TripRepositoryPort;
    const planNodeRepository = {
      listByTrip: jest.fn().mockResolvedValue([
        createPlanNode({
          id: 'node-root',
          type: 'section',
          title: 'Arrival',
          costAmount: 650,
          costCurrency: 'USD',
        }),
      ]),
    } as unknown as PlanNodeRepositoryPort;
    const service = new GetTripBudgetSummaryService(
      tripRepository,
      planNodeRepository,
    );

    await expect(
      service.execute({
        userId: 'user-02',
        tripId: 'trip-02',
      }),
    ).resolves.toMatchObject({
      currency: 'USD',
      totalBudgetAmount: 650,
      totalPlannedAmount: 650,
      remainingAmount: 0,
      totalDays: 0,
      totalActivities: 0,
      isOverBudget: false,
      hasMixedCurrencies: false,
      totalsByCurrency: [
        {
          currency: 'USD',
          plannedAmount: 650,
          nodeCount: 1,
        },
      ],
    });
  });

  it('rejects missing trips', async () => {
    const service = new GetTripBudgetSummaryService(
      {
        findByIdForUser: jest.fn().mockResolvedValue(null),
      } as unknown as TripRepositoryPort,
      {
        listByTrip: jest.fn(),
      } as unknown as PlanNodeRepositoryPort,
    );

    await expect(
      service.execute({
        userId: 'user-missing',
        tripId: 'trip-missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createPlanNode(overrides: Partial<PlanNode> = {}) {
  return PlanNode.create({
    id: overrides.id ?? 'node-default',
    tripId: overrides.tripId ?? 'trip-01',
    parentId: overrides.parentId ?? null,
    type: overrides.type ?? 'note',
    title: overrides.title ?? 'Budget node',
    costAmount: overrides.costAmount ?? null,
    costCurrency: overrides.costCurrency ?? null,
    sortOrder: overrides.sortOrder ?? 0,
    depth: overrides.depth ?? 0,
  });
}
