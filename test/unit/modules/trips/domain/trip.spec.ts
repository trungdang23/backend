import { Trip } from '../../../../../src/modules/trips/domain/trip';

describe('Trip domain entity', () => {
  it('creates a trip and normalizes the budget currency', () => {
    const trip = Trip.create({
      userId: 'user-01',
      name: '  Da Nang Escape  ',
      destination: '  Da Nang  ',
      startDate: '2026-06-10',
      endDate: '2026-06-14',
      timezone: 'Asia/Ho_Chi_Minh',
      budgetAmount: 1000000,
      budgetCurrency: 'vnd',
    });

    expect(trip.name).toBe('Da Nang Escape');
    expect(trip.destination).toBe('Da Nang');
    expect(trip.budgetCurrency).toBe('VND');
  });

  it('rejects invalid date ranges', () => {
    expect(() =>
      Trip.create({
        userId: 'user-01',
        name: 'Trip',
        destination: 'Da Nang',
        startDate: '2026-06-15',
        endDate: '2026-06-10',
        timezone: 'Asia/Ho_Chi_Minh',
        budgetAmount: 1000000,
        budgetCurrency: 'VND',
      }),
    ).toThrow('Start date must be on or before end date.');
  });

  it('rejects invalid timezones', () => {
    expect(() =>
      Trip.create({
        userId: 'user-01',
        name: 'Trip',
        destination: 'Da Nang',
        startDate: '2026-06-10',
        endDate: '2026-06-14',
        timezone: 'Mars/Olympus_Mons',
        budgetAmount: 1000000,
        budgetCurrency: 'VND',
      }),
    ).toThrow('Timezone must be a valid IANA timezone.');
  });
});
