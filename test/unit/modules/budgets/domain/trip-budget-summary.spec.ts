import { TripBudgetSummary } from '../../../../../src/modules/budgets/domain/trip-budget-summary';

describe('TripBudgetSummary domain value object', () => {
  it('calculates the remaining amount while staying within budget', () => {
    const summary = TripBudgetSummary.create({
      tripId: 'trip-01',
      currency: 'vnd',
      totalBudgetAmount: 1_000_000,
      totalPlannedAmount: 250_000,
      totalDays: 2,
      totalActivities: 3,
    });

    expect(summary.currency).toBe('VND');
    expect(summary.remainingAmount).toBe(750_000);
    expect(summary.isOverBudget).toBe(false);
  });

  it('marks the summary as over budget when planned cost exceeds budget', () => {
    const summary = TripBudgetSummary.create({
      tripId: 'trip-02',
      currency: 'USD',
      totalBudgetAmount: 500,
      totalPlannedAmount: 650,
      totalDays: 1,
      totalActivities: 2,
    });

    expect(summary.remainingAmount).toBe(-150);
    expect(summary.isOverBudget).toBe(true);
  });
});
