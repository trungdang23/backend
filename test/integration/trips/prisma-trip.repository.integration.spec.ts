import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';
import { PrismaTripRepository } from '../../../src/modules/trips/infrastructure/prisma/prisma-trip.repository';

describe('PrismaTripRepository integration', () => {
  const prisma = new PrismaService();
  const repository = new PrismaTripRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates a trip and finds it only for the owner', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'owner@example.com',
        passwordHash: 'hashed-password',
        displayName: 'Owner',
      },
    });

    const trip = await repository.create({
      userId: owner.id,
      name: 'Da Nang Escape',
      destination: 'Da Nang',
      startDate: '2026-06-10',
      endDate: '2026-06-14',
      timezone: 'Asia/Ho_Chi_Minh',
      budgetAmount: 1000000,
      budgetCurrency: 'VND',
    });

    const foundTrip = await repository.findByIdForUser({
      tripId: trip.id,
      userId: owner.id,
    });
    const foreignLookup = await repository.findByIdForUser({
      tripId: trip.id,
      userId: 'another-user',
    });

    expect(foundTrip).not.toBeNull();
    expect(foundTrip?.name).toBe('Da Nang Escape');
    expect(foundTrip?.destination).toBe('Da Nang');
    expect(foreignLookup).toBeNull();
  });

  it('lists trips with pagination and sort scoped to one user', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'list-owner@example.com',
        passwordHash: 'hashed-password',
      },
    });
    const anotherUser = await prisma.user.create({
      data: {
        email: 'other-owner@example.com',
        passwordHash: 'hashed-password',
      },
    });

    await repository.create({
      userId: owner.id,
      name: 'Hoi An',
      destination: 'Hoi An',
      startDate: '2026-07-12',
      endDate: '2026-07-15',
      timezone: 'Asia/Ho_Chi_Minh',
      budgetAmount: 3500000,
      budgetCurrency: 'VND',
    });
    await repository.create({
      userId: owner.id,
      name: 'Da Nang',
      destination: 'Da Nang',
      startDate: '2026-06-10',
      endDate: '2026-06-14',
      timezone: 'Asia/Ho_Chi_Minh',
      budgetAmount: 1000000,
      budgetCurrency: 'VND',
    });
    await repository.create({
      userId: anotherUser.id,
      name: 'Nha Trang',
      destination: 'Nha Trang',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      timezone: 'Asia/Ho_Chi_Minh',
      budgetAmount: 2000000,
      budgetCurrency: 'VND',
    });

    const pageOne = await repository.listByUser({
      userId: owner.id,
      page: 0,
      size: 1,
      sort: {
        field: 'startDate',
        direction: 'asc',
      },
    });
    const pageTwo = await repository.listByUser({
      userId: owner.id,
      page: 1,
      size: 1,
      sort: {
        field: 'startDate',
        direction: 'asc',
      },
    });

    expect(pageOne.totalElements).toBe(2);
    expect(pageOne.trips).toHaveLength(1);
    expect(pageOne.trips[0]?.name).toBe('Da Nang');
    expect(pageTwo.totalElements).toBe(2);
    expect(pageTwo.trips).toHaveLength(1);
    expect(pageTwo.trips[0]?.name).toBe('Hoi An');
  });

  it('updates and deletes a persisted trip', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'update-owner@example.com',
        passwordHash: 'hashed-password',
      },
    });

    const trip = await repository.create({
      userId: owner.id,
      name: 'Hue Discovery',
      destination: 'Hue',
      startDate: '2026-09-10',
      endDate: '2026-09-12',
      timezone: 'Asia/Ho_Chi_Minh',
      budgetAmount: 1500000,
      budgetCurrency: 'VND',
    });

    const updatedTrip = trip.update({
      destination: 'Hue Imperial City',
      budgetAmount: 1750000,
    });

    const persistedTrip = await repository.update(updatedTrip);
    const deletedTrip = await repository.delete({
      tripId: trip.id,
      userId: owner.id,
    });
    const foundAfterDelete = await repository.findByIdForUser({
      tripId: trip.id,
      userId: owner.id,
    });

    expect(persistedTrip.destination).toBe('Hue Imperial City');
    expect(persistedTrip.budgetAmount).toBe(1750000);
    expect(deletedTrip?.id).toBe(trip.id);
    expect(foundAfterDelete).toBeNull();
  });
});
