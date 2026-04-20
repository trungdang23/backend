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

describe('Posts e2e', () => {
  let app: INestApplication;
  let expressApp: Express;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a post through the auth pipeline and serves it publicly', async () => {
    const registerResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'posts.e2e@example.com',
        password: 'password123',
        displayName: 'Posts E2E',
      },
    });
    const registerBody = registerResponse.body as {
      success: boolean;
      data: {
        tokens: {
          accessToken: string;
        };
      };
    };

    expect(registerResponse.statusCode).toBe(201);
    expect(registerBody.success).toBe(true);

    const accessToken = registerBody.data.tokens.accessToken;

    const tripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        name: 'Da Lat Coffee Run',
        startDate: '2026-08-02',
        endDate: '2026-08-05',
        budgetMode: 'manual',
        manualBudgetAmount: 2800000,
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
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        title: 'Da Lat mornings and night market notes',
        content:
          'Nhịp đi chậm, nhiều cafe sáng và giữ trống một buổi tối cho chợ đêm.',
        tripId: tripBody.data.id,
      },
    });
    const createBody = createResponse.body as {
      success: boolean;
      data: {
        id: string;
        trip: {
          id: string;
        } | null;
      };
    };

    expect(createResponse.statusCode).toBe(201);
    expect(createBody.success).toBe(true);
    expect(createBody.data.trip?.id).toBe(tripBody.data.id);

    const listResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/posts?page=0&size=12&sort=createdAt,desc',
    });
    const listBody = listResponse.body as {
      success: boolean;
      data: Array<{
        id: string;
      }>;
      meta: {
        totalElements: number;
      };
    };

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.success).toBe(true);
    expect(listBody.data[0]?.id).toBe(createBody.data.id);
    expect(listBody.meta.totalElements).toBe(1);

    const detailResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/posts/${createBody.data.id}`,
    });
    const detailBody = detailResponse.body as {
      success: boolean;
      data: {
        title: string;
      };
    };

    expect(detailResponse.statusCode).toBe(200);
    expect(detailBody.success).toBe(true);
    expect(detailBody.data.title).toBe(
      'Da Lat mornings and night market notes',
    );
  });
});
