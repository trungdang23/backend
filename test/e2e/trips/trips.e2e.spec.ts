import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { TRIP_REPOSITORY } from '../../../src/modules/trips/application/ports/trip-repository.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { dispatchRequest } from '../../support/dispatch-request';
import { InMemoryTripRepository } from '../../support/in-memory-trip-repository';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

describe('Trips e2e', () => {
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

  it('creates, lists, updates, and deletes a trip through the HTTP app pipeline', async () => {
    const registerResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'trips.e2e@example.com',
        password: 'password123',
        displayName: 'E2E Traveler',
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

    const createResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        name: 'Da Nang Sprint',
        summaryNotes: 'A faster first pass with one strong photo spot.',
        coverImageUrl: 'https://example.com/da-nang-sprint.jpg',
        startDate: '2026-06-10',
        endDate: '2026-06-14',
        budgetMode: 'manual',
        manualBudgetAmount: 1000000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      },
    });
    const createBody = createResponse.body as {
      success: boolean;
      data: {
        id: string;
        destination: string | null;
        summaryNotes: string | null;
        coverImageUrl: string | null;
        timezone: string | null;
        budgetMode: string;
        manualBudgetAmount: number | null;
        manualBudgetCurrency: string | null;
        visibility: string;
      };
    };

    expect(createResponse.statusCode).toBe(201);
    expect(createBody.success).toBe(true);
    expect(createBody.data.destination).toBeNull();
    expect(createBody.data.summaryNotes).toBe(
      'A faster first pass with one strong photo spot.',
    );
    expect(createBody.data.coverImageUrl).toBe(
      'https://example.com/da-nang-sprint.jpg',
    );
    expect(createBody.data.timezone).toBeNull();
    expect(createBody.data.budgetMode).toBe('manual');
    expect(createBody.data.manualBudgetAmount).toBe(1000000);
    expect(createBody.data.manualBudgetCurrency).toBe('VND');
    expect(createBody.data.visibility).toBe('private');

    const listResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/trips?page=0&size=20&sort=startDate,asc',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
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
      path: `/api/v1/trips/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(detailResponse.statusCode).toBe(200);

    const updateResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/trips/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        name: 'Da Nang Sprint Updated',
        summaryNotes: 'Expanded into a slower plan for the riverside evenings.',
        coverImageUrl: null,
        budgetMode: 'auto',
        visibility: 'public',
      },
    });
    const updateBody = updateResponse.body as {
      success: boolean;
      data: {
        name: string;
        summaryNotes: string | null;
        coverImageUrl: string | null;
        budgetMode: string;
        manualBudgetAmount: number | null;
        visibility: string;
      };
    };

    expect(updateResponse.statusCode).toBe(200);
    expect(updateBody.success).toBe(true);
    expect(updateBody.data.name).toBe('Da Nang Sprint Updated');
    expect(updateBody.data.summaryNotes).toBe(
      'Expanded into a slower plan for the riverside evenings.',
    );
    expect(updateBody.data.coverImageUrl).toBeNull();
    expect(updateBody.data.budgetMode).toBe('auto');
    expect(updateBody.data.manualBudgetAmount).toBeNull();
    expect(updateBody.data.visibility).toBe('public');

    const deleteResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: `/api/v1/trips/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(200);

    const listAfterDeleteResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/trips?page=0&size=20&sort=startDate,asc',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const listAfterDeleteBody = listAfterDeleteResponse.body as {
      success: boolean;
      data: unknown[];
      meta: {
        totalElements: number;
      };
    };

    expect(listAfterDeleteResponse.statusCode).toBe(200);
    expect(listAfterDeleteBody.success).toBe(true);
    expect(listAfterDeleteBody.data).toHaveLength(0);
    expect(listAfterDeleteBody.meta.totalElements).toBe(0);
  });

  it('reads public trip detail without authentication', async () => {
    const registerResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'trips.public.e2e@example.com',
        password: 'password123',
        displayName: 'Public Traveler',
      },
    });
    const registerBody = registerResponse.body as {
      data: {
        tokens: {
          accessToken: string;
        };
      };
    };

    const createResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${registerBody.data.tokens.accessToken}`,
      },
      body: {
        name: 'Public Sa Pa Draft',
        startDate: '2026-12-01',
        endDate: '2026-12-04',
        budgetMode: 'manual',
        manualBudgetAmount: 3900000,
        manualBudgetCurrency: 'VND',
        visibility: 'public',
      },
    });
    const createBody = createResponse.body as {
      data: {
        id: string;
      };
    };

    const detailResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/public/trips/${createBody.data.id}`,
    });
    const detailBody = detailResponse.body as {
      success: boolean;
      data: {
        id: string;
        visibility: string;
      };
    };

    expect(detailResponse.statusCode).toBe(200);
    expect(detailBody.success).toBe(true);
    expect(detailBody.data.id).toBe(createBody.data.id);
    expect(detailBody.data.visibility).toBe('public');
  });
});
