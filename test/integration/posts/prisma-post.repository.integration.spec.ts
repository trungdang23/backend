import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';
import { PrismaPostRepository } from '../../../src/modules/posts/infrastructure/prisma/prisma-post.repository';

describe('PrismaPostRepository integration', () => {
  const prisma = new PrismaService();
  const repository = new PrismaPostRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.planNode.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates a post and reads it back by id', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'posts-owner@example.com',
        passwordHash: 'hashed-password',
        displayName: 'Owner',
      },
    });
    const trip = await prisma.trip.create({
      data: {
        userId: owner.id,
        name: 'Hoi An Story',
        startDate: '2026-07-12',
        endDate: '2026-07-15',
        budgetAmount: 3_500_000,
        budgetCurrency: 'VND',
        budgetMode: 'manual',
        manualBudgetAmount: 3_500_000,
        manualBudgetCurrency: 'VND',
        visibility: 'public',
      },
    });

    const createdPost = await repository.create({
      userId: owner.id,
      tripId: trip.id,
      title: 'Hoi An notes',
      content: 'Coffee first, lanterns later, and one empty afternoon.',
      coverImageUrl: 'https://example.com/posts/hoi-an.jpg',
      visibility: 'public',
    });
    const foundPost = await repository.findById(createdPost.id);

    expect(foundPost).not.toBeNull();
    expect(foundPost?.title).toBe('Hoi An notes');
    expect(foundPost?.tripId).toBe(trip.id);
    expect(foundPost?.coverImageUrl).toBe(
      'https://example.com/posts/hoi-an.jpg',
    );
    expect(foundPost?.visibility).toBe('public');
  });

  it('lists only public posts with pagination and sort', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'posts-list@example.com',
        passwordHash: 'hashed-password',
      },
    });

    await repository.create({
      userId: owner.id,
      title: 'Older post',
      content: 'Created first.',
      visibility: 'public',
    });
    await prisma.post.create({
      data: {
        userId: owner.id,
        title: 'Hidden post',
        content: 'Should not be visible in public list.',
        visibility: 'private',
      },
    });
    await repository.create({
      userId: owner.id,
      title: 'Newer post',
      content: 'Created second.',
      visibility: 'public',
    });

    const result = await repository.listPublic({
      page: 0,
      size: 10,
      sort: {
        field: 'createdAt',
        direction: 'desc',
      },
    });

    expect(result.totalElements).toBe(2);
    expect(result.posts).toHaveLength(2);
    expect(result.posts.map((post) => post.title)).toEqual([
      'Newer post',
      'Older post',
    ]);
  });

  it('lists only posts owned by the requested user', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'posts-owner-filter@example.com',
        passwordHash: 'hashed-password',
      },
    });
    const otherUser = await prisma.user.create({
      data: {
        email: 'posts-other-filter@example.com',
        passwordHash: 'hashed-password',
      },
    });

    await repository.create({
      userId: owner.id,
      title: 'Owner newer post',
      content: 'Owned by current user.',
      visibility: 'public',
    });
    await repository.create({
      userId: otherUser.id,
      title: 'Other user post',
      content: 'Should not appear.',
      visibility: 'public',
    });
    await repository.create({
      userId: owner.id,
      title: 'Owner older post',
      content: 'Still belongs to current user.',
      visibility: 'public',
    });

    const result = await repository.listByUser({
      userId: owner.id,
      page: 0,
      size: 10,
      sort: {
        field: 'createdAt',
        direction: 'desc',
      },
    });

    expect(result.totalElements).toBe(2);
    expect(result.posts).toHaveLength(2);
    expect(result.posts.every((post) => post.userId === owner.id)).toBe(true);
    expect(result.posts.map((post) => post.title).sort()).toEqual([
      'Owner newer post',
      'Owner older post',
    ]);
  });
});
