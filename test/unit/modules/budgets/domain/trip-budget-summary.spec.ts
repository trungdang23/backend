import { TripBudgetSummary } from '../../../../../src/modules/budgets/domain/trip-budget-summary';

describe('TripBudgetSummary domain value object', () => {
  it('calculates the remaining amount and normalizes per-currency totals', () => {
    const summary = TripBudgetSummary.create({
      tripId: 'trip-01',
      currency: 'vnd',
      totalBudgetAmount: 1_000_000,
      totalPlannedAmount: 250_000,
      totalDays: 2,
      totalActivities: 3,
      hasMixedCurrencies: false,
      totalsByCurrency: [
        {
          currency: 'vnd',
          plannedAmount: 250_000,
          nodeCount: 2,
        },
      ],
    });

    expect(summary.currency).toBe('VND');
    expect(summary.remainingAmount).toBe(750_000);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.hasMixedCurrencies).toBe(false);
    expect(summary.totalsByCurrency).toEqual([
      {
        currency: 'VND',
        plannedAmount: 250_000,
        nodeCount: 2,
      },
    ]);
  });

  it('marks the summary as mixed when compatibility fields cover only one display currency', () => {
    const summary = TripBudgetSummary.create({
      tripId: 'trip-02',
      currency: 'USD',
      totalBudgetAmount: 500,
      totalPlannedAmount: 500,
      totalDays: 1,
      totalActivities: 2,
      hasMixedCurrencies: true,
      totalsByCurrency: [
        {
          currency: 'usd',
          plannedAmount: 500,
          nodeCount: 1,
        },
        {
          currency: 'vnd',
          plannedAmount: 250_000,
          nodeCount: 1,
        },
      ],
    });

    expect(summary.remainingAmount).toBe(0);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.hasMixedCurrencies).toBe(true);
    expect(summary.totalsByCurrency).toEqual([
      {
        currency: 'USD',
        plannedAmount: 500,
        nodeCount: 1,
      },
      {
        currency: 'VND',
        plannedAmount: 250_000,
        nodeCount: 1,
      },
    ]);
  });
});
