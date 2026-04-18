import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';
import { PrismaPlanNodeRepository } from '../../../src/modules/planning/infrastructure/prisma/prisma-plan-node.repository';
import { PlanNode } from '../../../src/modules/planning/domain/plan-node';

describe('PrismaPlanNodeRepository integration', () => {
  const prisma = new PrismaService();
  const repository = new PrismaPlanNodeRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.planNode.deleteMany();
    await prisma.tripItineraryActivity.deleteMany();
    await prisma.tripItineraryDay.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
  });

  it('persists planner nodes in tree order and cascades child deletion', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'plan-node-owner@example.com',
        passwordHash: 'hashed-password',
      },
    });
    const trip = await prisma.trip.create({
      data: {
        userId: owner.id,
        name: 'Da Lat Planner',
        startDate: '2026-07-12',
        endDate: '2026-07-15',
        budgetAmount: 1000000,
        budgetCurrency: 'VND',
      },
    });

    const rootNode = await repository.create(
      PlanNode.create({
        tripId: trip.id,
        type: 'day',
        title: 'Arrival day',
        sortOrder: 0,
        depth: 0,
      }),
    );
    const secondRootNode = await repository.create(
      PlanNode.create({
        tripId: trip.id,
        type: 'day',
        title: 'Second day',
        sortOrder: 1,
        depth: 0,
      }),
    );
    const childNode = await repository.create(
      PlanNode.create({
        tripId: trip.id,
        parentId: rootNode.id,
        type: 'activity',
        title: 'Coffee stop',
        sortOrder: 0,
        depth: 1,
      }),
    );

    const listedNodes = await repository.listByTrip({
      tripId: trip.id,
    });

    expect(listedNodes.map((node) => node.title)).toEqual([
      'Arrival day',
      'Coffee stop',
      'Second day',
    ]);

    await repository.delete(rootNode.id);

    const remainingNodes = await repository.listByTrip({
      tripId: trip.id,
    });

    expect(remainingNodes).toHaveLength(1);
    expect(remainingNodes[0]?.id).toBe(secondRootNode.id);
    expect(remainingNodes.find((node) => node.id === childNode.id)).toBeUndefined();
  });
});
