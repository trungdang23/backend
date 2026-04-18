import { Trip } from '../../../../../src/modules/trips/domain/trip';

describe('Trip domain entity', () => {
  it('creates a manual trip and normalizes the budget currency', () => {
    const trip = Trip.create({
      userId: 'user-01',
      name: '  Da Nang Escape  ',
      destination: '  Da Nang  ',
      summaryNotes: '  Sunset by the Han River and a slower second day.  ',
      coverImageUrl: '  https://example.com/cover.jpg  ',
      startDate: '2026-06-10',
      endDate: '2026-06-14',
      timezone: 'Asia/Ho_Chi_Minh',
      budgetMode: 'manual',
      manualBudgetAmount: 1000000,
      manualBudgetCurrency: 'vnd',
      visibility: 'public',
    });

    expect(trip.name).toBe('Da Nang Escape');
    expect(trip.destination).toBe('Da Nang');
    expect(trip.summaryNotes).toBe(
      'Sunset by the Han River and a slower second day.',
    );
    expect(trip.coverImageUrl).toBe('https://example.com/cover.jpg');
    expect(trip.budgetMode).toBe('manual');
    expect(trip.manualBudgetAmount).toBe(1000000);
    expect(trip.manualBudgetCurrency).toBe('VND');
    expect(trip.budgetCurrency).toBe('VND');
    expect(trip.visibility).toBe('public');
  });

  it('treats blank optional media fields as null', () => {
    const trip = Trip.create({
      userId: 'user-01',
      name: 'Da Nang Escape',
      destination: '   ',
      summaryNotes: '   ',
      coverImageUrl: '   ',
      startDate: '2026-06-10',
      endDate: '2026-06-14',
      timezone: '   ',
      budgetMode: 'manual',
      manualBudgetAmount: 1000000,
      manualBudgetCurrency: 'VND',
    });

    expect(trip.destination).toBeNull();
    expect(trip.summaryNotes).toBeNull();
    expect(trip.coverImageUrl).toBeNull();
    expect(trip.timezone).toBeNull();
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
        budgetMode: 'manual',
        manualBudgetAmount: 1000000,
        manualBudgetCurrency: 'VND',
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
        budgetMode: 'manual',
        manualBudgetAmount: 1000000,
        manualBudgetCurrency: 'VND',
      }),
    ).toThrow('Timezone must be a valid IANA timezone.');
  });

  it('rejects invalid cover image URLs', () => {
    expect(() =>
      Trip.create({
        userId: 'user-01',
        name: 'Trip',
        destination: 'Da Nang',
        coverImageUrl: 'ftp://example.com/trip.jpg',
        startDate: '2026-06-10',
        endDate: '2026-06-14',
        timezone: 'Asia/Ho_Chi_Minh',
        budgetMode: 'manual',
        manualBudgetAmount: 1000000,
        manualBudgetCurrency: 'VND',
      }),
    ).toThrow('Trip cover image URL must be a valid http or https URL.');
  });

  it('creates an auto trip without manual budget fields', () => {
    const trip = Trip.create({
      userId: 'user-01',
      name: 'Auto Budget Trip',
      startDate: '2026-06-10',
      endDate: '2026-06-14',
      budgetMode: 'auto',
    });

    expect(trip.budgetMode).toBe('auto');
    expect(trip.manualBudgetAmount).toBeNull();
    expect(trip.manualBudgetCurrency).toBeNull();
    expect(trip.budgetAmount).toBe(0);
    expect(trip.budgetCurrency).toBe('VND');
    expect(trip.visibility).toBe('private');
  });

  it('rejects a manual trip without a manual budget', () => {
    expect(() =>
      Trip.create({
        userId: 'user-01',
        name: 'Trip',
        startDate: '2026-06-10',
        endDate: '2026-06-14',
        budgetMode: 'manual',
      }),
    ).toThrow(
      'Manual budget amount and currency are required when budget mode is manual.',
    );
  });

  it('rejects manual budget fields when budget mode is auto', () => {
    expect(() =>
      Trip.create({
        userId: 'user-01',
        name: 'Trip',
        startDate: '2026-06-10',
        endDate: '2026-06-14',
        budgetMode: 'auto',
        manualBudgetAmount: 1000000,
        manualBudgetCurrency: 'VND',
      }),
    ).toThrow('Manual budget must be empty when budget mode is auto.');
  });
});
