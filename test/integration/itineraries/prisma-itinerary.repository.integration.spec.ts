import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';
import { PrismaItineraryRepository } from '../../../src/modules/itineraries/infrastructure/prisma/prisma-itinerary.repository';

describe('PrismaItineraryRepository integration', () => {
  const prisma = new PrismaService();
  const repository = new PrismaItineraryRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.tripItineraryActivity.deleteMany();
    await prisma.tripItineraryDay.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates itinerary days and activities and lists them for one trip only', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'itinerary-owner@example.com',
        passwordHash: 'hashed-password',
      },
    });
    const foreignOwner = await prisma.user.create({
      data: {
        email: 'itinerary-foreign@example.com',
        passwordHash: 'hashed-password',
      },
    });
    const trip = await prisma.trip.create({
      data: {
        userId: owner.id,
        name: 'Da Nang Sprint',
        destination: 'Da Nang',
        startDate: '2026-06-10',
        endDate: '2026-06-14',
        timezone: 'Asia/Ho_Chi_Minh',
        budgetAmount: 1_000_000,
        budgetCurrency: 'VND',
      },
    });
    const foreignTrip = await prisma.trip.create({
      data: {
        userId: foreignOwner.id,
        name: 'Hue',
        destination: 'Hue',
        startDate: '2026-06-11',
        endDate: '2026-06-12',
        timezone: 'Asia/Ho_Chi_Minh',
        budgetAmount: 500_000,
        budgetCurrency: 'VND',
      },
    });

    const firstDay = await repository.createDay({
      tripId: trip.id,
      date: '2026-06-10',
    });
    const secondDay = await repository.createDay({
      tripId: trip.id,
      date: '2026-06-11',
    });
    await repository.createDay({
      tripId: foreignTrip.id,
      date: '2026-06-11',
    });

    await repository.createActivity({
      itineraryDayId: secondDay.id,
      title: 'My Khe Beach',
      startsAt: '08:00',
      location: 'My Khe',
      notes: 'Morning walk',
      costAmount: 0,
      costCurrency: 'VND',
      position: 1,
    });
    await repository.createActivity({
      itineraryDayId: firstDay.id,
      title: 'Dragon Bridge',
      startsAt: '19:00',
      location: 'Da Nang',
      notes: 'Night photos',
      costAmount: 200_000,
      costCurrency: 'VND',
      position: 1,
    });

    const foundDay = await repository.findDayByDateForTrip({
      tripId: trip.id,
      date: '2026-06-10',
    });
    const aggregates = await repository.listDayAggregatesByTrip({
      tripId: trip.id,
    });

    expect(foundDay?.id).toBe(firstDay.id);
    expect(aggregates).toHaveLength(2);
    expect(aggregates[0]?.day.date).toBe('2026-06-10');
    expect(aggregates[0]?.activities[0]?.title).toBe('Dragon Bridge');
    expect(aggregates[1]?.day.date).toBe('2026-06-11');
    expect(aggregates[1]?.activities[0]?.title).toBe('My Khe Beach');
  });

  it('updates a persisted itinerary activity', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'itinerary-update@example.com',
        passwordHash: 'hashed-password',
      },
    });
    const trip = await prisma.trip.create({
      data: {
        userId: owner.id,
        name: 'Hoi An Lights',
        destination: 'Hoi An',
        startDate: '2026-07-12',
        endDate: '2026-07-15',
        timezone: 'Asia/Ho_Chi_Minh',
        budgetAmount: 2_000_000,
        budgetCurrency: 'VND',
      },
    });
    const day = await repository.createDay({
      tripId: trip.id,
      date: '2026-07-12',
    });
    const activity = await repository.createActivity({
      itineraryDayId: day.id,
      title: 'Lantern Street',
      startsAt: '18:30',
      location: 'Hoi An Old Town',
      notes: 'Bring camera',
      costAmount: 150_000,
      costCurrency: 'VND',
      position: 1,
    });

    const updatedActivity = activity.update({
      notes: 'Bring camera and tripod',
      costAmount: 225_000,
    });

    await repository.updateActivity(updatedActivity);

    const refreshedDay = await repository.findDayAggregateByIdForTrip({
      tripId: trip.id,
      dayId: day.id,
    });

    expect(refreshedDay?.activities[0]?.notes).toBe('Bring camera and tripod');
    expect(refreshedDay?.activities[0]?.costAmount).toBe(225_000);
  });
});
