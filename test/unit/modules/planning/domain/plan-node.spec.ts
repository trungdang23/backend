import { PlanNode } from '../../../../../src/modules/planning/domain/plan-node';

describe('PlanNode domain', () => {
  it('normalizes cost currency and validates end time', () => {
    const node = PlanNode.create({
      tripId: 'trip-1',
      type: 'activity',
      title: 'Dinner by the river',
      startAt: '2026-07-12T18:00',
      endAt: '2026-07-12T20:00',
      costAmount: 250000,
      costCurrency: 'vnd',
      sortOrder: 0,
      depth: 0,
    });

    expect(node.costCurrency).toBe('VND');
    expect(node.costAmount).toBe(250000);
  });

  it('rejects incomplete cost pairs', () => {
    expect(() =>
      PlanNode.create({
        tripId: 'trip-1',
        type: 'activity',
        title: 'Dinner by the river',
        costAmount: 250000,
        sortOrder: 0,
        depth: 0,
      }),
    ).toThrow(
      'Cost amount and cost currency must either both be provided or both be empty.',
    );
  });

  it('rejects an end time before the start time', () => {
    expect(() =>
      PlanNode.create({
        tripId: 'trip-1',
        type: 'activity',
        title: 'Dinner by the river',
        startAt: '2026-07-12T20:00',
        endAt: '2026-07-12T18:00',
        sortOrder: 0,
        depth: 0,
      }),
    ).toThrow('End at must be on or after start at.');
  });
});
