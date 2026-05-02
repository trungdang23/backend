import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { POST_REPOSITORY } from '../../../src/modules/posts/application/ports/post-repository.port';
import { TRIP_REPOSITORY } from '../../../src/modules/trips/application/ports/trip-repository.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { dispatchRequest } from '../../support/dispatch-request';
import { InMemoryPostRepository } from '../../support/in-memory-post-repository';
import { InMemoryTripRepository } from '../../support/in-memory-trip-repository';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

describe('Posts integration', () => {
  let app: INestApplication;
  let expressApp: Express;
  let postRepository: InMemoryPostRepository;
  let tripRepository: InMemoryTripRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .overrideProvider(TRIP_REPOSITORY)
      .useClass(InMemoryTripRepository)
      .overrideProvider(POST_REPOSITORY)
      .useClass(InMemoryPostRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();

    expressApp = app.getHttpAdapter().getInstance() as Express;
    postRepository = app.get<InMemoryPostRepository>(POST_REPOSITORY);
    tripRepository = app.get<InMemoryTripRepository>(TRIP_REPOSITORY);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    postRepository.clear();
    tripRepository.clear();
  });

  it('creates a community post, lists it publicly, and serves its detail', async () => {
    const traveler = await registerUser(expressApp, 'posts.one@example.com');

    const tripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Hoi An Slow Days',
        coverImageUrl: 'https://example.com/hoi-an-trip.jpg',
        startDate: '2026-07-12',
        endDate: '2026-07-15',
        budgetMode: 'manual',
        manualBudgetAmount: 3500000,
        manualBudgetCurrency: 'VND',
        visibility: 'public',
      },
    });
    const tripBody = tripResponse.body as {
      data: {
        id: string;
      };
    };

    const createResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/posts',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        title: 'Ba ngày đi chậm lại ở Hoi An',
        content:
          'Mình giữ mỗi ngày 2-3 điểm chính, nhiều thời gian cho cafe và đi bộ.',
        coverImageUrl: 'https://example.com/hoi-an-post.jpg',
        tripId: tripBody.data.id,
      },
    });
    const createBody = createResponse.body as {
      success: boolean;
      data: {
        id: string;
        title: string;
        visibility: string;
        author: {
          displayName: string | null;
        };
        trip: {
          id: string;
          name: string;
          coverImageUrl: string | null;
        } | null;
      };
    };

    expect(createResponse.statusCode).toBe(201);
    expect(createBody.success).toBe(true);
    expect(createBody.data.title).toBe('Ba ngày đi chậm lại ở Hoi An');
    expect(createBody.data.visibility).toBe('public');
    expect(createBody.data.author.displayName).toBe('posts.one');
    expect(createBody.data.trip).toEqual({
      id: tripBody.data.id,
      name: 'Hoi An Slow Days',
      coverImageUrl: 'https://example.com/hoi-an-trip.jpg',
    });

    const listResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/posts?page=0&size=12&sort=createdAt,desc',
    });
    const listBody = listResponse.body as {
      success: boolean;
      data: Array<{
        id: string;
        title: string;
        author: {
          displayName: string | null;
        };
      }>;
      meta: {
        page: number;
        size: number;
        sort: string;
        totalElements: number;
        totalPages: number;
      };
    };

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.success).toBe(true);
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0]?.id).toBe(createBody.data.id);
    expect(listBody.data[0]?.author.displayName).toBe('posts.one');
    expect(listBody.meta).toEqual({
      page: 0,
      size: 12,
      sort: 'createdAt,desc',
      totalElements: 1,
      totalPages: 1,
    });

    const detailResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/posts/${createBody.data.id}`,
    });
    const detailBody = detailResponse.body as {
      success: boolean;
      data: {
        id: string;
        content: string;
        author: {
          displayName: string | null;
        };
        trip: {
          id: string;
        } | null;
      };
    };

    expect(detailResponse.statusCode).toBe(200);
    expect(detailBody.success).toBe(true);
    expect(detailBody.data.id).toBe(createBody.data.id);
    expect(detailBody.data.content).toContain('cafe và đi bộ');
    expect(detailBody.data.author.displayName).toBe('posts.one');
    expect(detailBody.data.trip?.id).toBe(tripBody.data.id);
  });

  it('rejects a linked trip that is still private', async () => {
    const traveler = await registerUser(
      expressApp,
      'posts.private@example.com',
    );

    const tripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Private Hue Notes',
        startDate: '2026-08-02',
        endDate: '2026-08-05',
        budgetMode: 'auto',
        visibility: 'private',
      },
    });
    const tripBody = tripResponse.body as {
      data: {
        id: string;
      };
    };

    const createResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/posts',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        title: 'Hue cuối tuần',
        content: 'Muốn viết lại hành trình này khi trip public hơn.',
        tripId: tripBody.data.id,
      },
    });
    const createBody = createResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(createResponse.statusCode).toBe(400);
    expect(createBody.success).toBe(false);
    expect(createBody.error.code).toBe('BAD_REQUEST');
    expect(createBody.error.message).toBe(
      'Trip must be public before creating a community post.',
    );
  });

  it('returns the trip error code when creating a post for a missing trip', async () => {
    const traveler = await registerUser(
      expressApp,
      'posts.missing-trip@example.com',
    );

    const createResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/posts',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        title: 'Trip không tồn tại',
        content: 'Bài viết này không nên được tạo.',
        tripId: 'trip-missing',
      },
    });
    const createBody = createResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(createResponse.statusCode).toBe(404);
    expect(createBody.success).toBe(false);
    expect(createBody.error.code).toBe('TRIP_NOT_FOUND');
    expect(createBody.error.message).toBe('Trip not found.');
  });

  it('requires auth for create and returns 404 for a missing post detail', async () => {
    const createResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/posts',
      body: {
        title: 'Guest should not create',
        content: 'This request should be rejected.',
      },
    });
    const createBody = createResponse.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(createResponse.statusCode).toBe(401);
    expect(createBody.success).toBe(false);
    expect(createBody.error.code).toBe('UNAUTHORIZED');

    const detailResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/posts/post-missing',
    });
    const detailBody = detailResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(detailResponse.statusCode).toBe(404);
    expect(detailBody.success).toBe(false);
    expect(detailBody.error.code).toBe('NOT_FOUND');
    expect(detailBody.error.message).toBe('Post not found.');
  });

  it('lists only posts created by the authenticated user on the mine route', async () => {
    const owner = await registerUser(
      expressApp,
      'posts.mine.owner@example.com',
    );
    const otherUser = await registerUser(
      expressApp,
      'posts.mine.other@example.com',
    );

    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/posts',
      headers: {
        authorization: `Bearer ${owner.accessToken}`,
      },
      body: {
        title: 'Bài viết của tôi',
        content: 'Bài này phải hiện trong tab cá nhân.',
      },
    });
    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/posts',
      headers: {
        authorization: `Bearer ${otherUser.accessToken}`,
      },
      body: {
        title: 'Bài viết của người khác',
        content: 'Bài này không được hiện trong mine của owner.',
      },
    });

    const mineResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/posts/mine?page=0&size=12&sort=createdAt,desc',
      headers: {
        authorization: `Bearer ${owner.accessToken}`,
      },
    });
    const mineBody = mineResponse.body as {
      success: boolean;
      data: Array<{
        title: string;
        userId: string;
      }>;
      meta: {
        totalElements: number;
      };
    };

    expect(mineResponse.statusCode).toBe(200);
    expect(mineBody.success).toBe(true);
    expect(mineBody.meta.totalElements).toBe(1);
    expect(mineBody.data).toHaveLength(1);
    expect(mineBody.data[0]?.title).toBe('Bài viết của tôi');
    expect(mineBody.data[0]?.userId).toBe(owner.userId);
  });
});

async function registerUser(expressApp: Express, email: string) {
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/auth/register',
    body: {
      email,
      password: 'password123',
      displayName: email.split('@')[0],
    },
  });
  const body = response.body as {
    success: boolean;
    data: {
      user: {
        id: string;
      };
      tokens: {
        accessToken: string;
      };
    };
  };

  if (response.statusCode !== 201 || body.success !== true) {
    throw new Error(`Failed to register integration user ${email}.`);
  }

  return {
    userId: body.data.user.id,
    accessToken: body.data.tokens.accessToken,
  };
}
