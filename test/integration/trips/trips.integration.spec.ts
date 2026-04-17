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

describe('Trips integration', () => {
  let app: INestApplication;
  let expressApp: Express;
  let tripRepository: InMemoryTripRepository;

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
    tripRepository = app.get<InMemoryTripRepository>(TRIP_REPOSITORY);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    tripRepository.clear();
  });

  it('creates, lists, and fetches trips only for the authenticated user', async () => {
    const firstTraveler = await registerUser(expressApp, 'trips.one@example.com');
    const secondTraveler = await registerUser(expressApp, 'trips.two@example.com');

    const laterTripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${firstTraveler.accessToken}`,
      },
      body: {
        name: 'Hoi An Lights',
        summaryNotes: 'Lanterns, coffee stops, and a slower second day.',
        coverImageUrl: 'https://example.com/hoi-an-cover.jpg',
        startDate: '2026-07-12',
        endDate: '2026-07-15',
        budgetAmount: 3500000,
        budgetCurrency: 'vnd',
      },
    });
    const laterTripBody = laterTripResponse.body as {
      success: boolean;
      data: {
        id: string;
        budgetCurrency: string;
        userId: string;
        summaryNotes: string | null;
        coverImageUrl: string | null;
      };
    };

    expect(laterTripResponse.statusCode).toBe(201);
    expect(laterTripBody.success).toBe(true);
    expect(laterTripBody.data.userId).toBe(firstTraveler.userId);
    expect(laterTripBody.data.budgetCurrency).toBe('VND');
    expect(laterTripBody.data.summaryNotes).toBe(
      'Lanterns, coffee stops, and a slower second day.',
    );
    expect(laterTripBody.data.coverImageUrl).toBe(
      'https://example.com/hoi-an-cover.jpg',
    );

    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${firstTraveler.accessToken}`,
      },
      body: {
        name: 'Da Nang Sunrise',
        startDate: '2026-06-10',
        endDate: '2026-06-14',
        budgetAmount: 1000000,
        budgetCurrency: 'VND',
      },
    });

    const foreignTripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${secondTraveler.accessToken}`,
      },
      body: {
        name: 'Nha Trang',
        startDate: '2026-08-01',
        endDate: '2026-08-05',
        budgetAmount: 2000000,
        budgetCurrency: 'VND',
      },
    });
    const foreignTripBody = foreignTripResponse.body as {
      data: {
        id: string;
      };
    };

    const listResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/trips?page=0&size=1&sort=startDate,asc',
      headers: {
        authorization: `Bearer ${firstTraveler.accessToken}`,
      },
    });
    const listBody = listResponse.body as {
      success: boolean;
      data: Array<{
        id: string;
        name: string;
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
    expect(listBody.data[0]?.name).toBe('Da Nang Sunrise');
    expect(listBody.meta).toEqual({
      page: 0,
      size: 1,
      sort: 'startDate,asc',
      totalElements: 2,
      totalPages: 2,
    });

    const detailResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${laterTripBody.data.id}`,
      headers: {
        authorization: `Bearer ${firstTraveler.accessToken}`,
      },
    });
    const detailBody = detailResponse.body as {
      success: boolean;
      data: {
        id: string;
        destination: string | null;
        summaryNotes: string | null;
        coverImageUrl: string | null;
        timezone: string | null;
      };
    };

    expect(detailResponse.statusCode).toBe(200);
    expect(detailBody.success).toBe(true);
    expect(detailBody.data).toMatchObject({
      id: laterTripBody.data.id,
      destination: null,
      summaryNotes: 'Lanterns, coffee stops, and a slower second day.',
      coverImageUrl: 'https://example.com/hoi-an-cover.jpg',
      timezone: null,
    });

    const missingResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${foreignTripBody.data.id}`,
      headers: {
        authorization: `Bearer ${firstTraveler.accessToken}`,
      },
    });
    const missingBody = missingResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(missingResponse.statusCode).toBe(404);
    expect(missingBody.success).toBe(false);
    expect(missingBody.error.code).toBe('NOT_FOUND');
    expect(missingBody.error.message).toBe('Trip not found.');
  });

  it('updates and deletes a trip for the current user', async () => {
    const traveler = await registerUser(expressApp, 'trips.update@example.com');
    const createResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Hue Discovery',
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        budgetAmount: 1500000,
        budgetCurrency: 'VND',
      },
    });
    const createBody = createResponse.body as {
      data: {
        id: string;
      };
    };

    const updateResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/trips/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Hue Discovery Updated',
        summaryNotes: 'Quiet mornings around the citadel.',
        coverImageUrl: 'https://example.com/hue-imperial.jpg',
        budgetAmount: 1750000,
      },
    });
    const updateBody = updateResponse.body as {
      success: boolean;
      data: {
        name: string;
        budgetAmount: number;
        summaryNotes: string | null;
        coverImageUrl: string | null;
      };
    };

    expect(updateResponse.statusCode).toBe(200);
    expect(updateBody.success).toBe(true);
    expect(updateBody.data.name).toBe('Hue Discovery Updated');
    expect(updateBody.data.budgetAmount).toBe(1750000);
    expect(updateBody.data.summaryNotes).toBe(
      'Quiet mornings around the citadel.',
    );
    expect(updateBody.data.coverImageUrl).toBe(
      'https://example.com/hue-imperial.jpg',
    );

    const emptyPatchResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/trips/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {},
    });
    const emptyPatchBody = emptyPatchResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(emptyPatchResponse.statusCode).toBe(400);
    expect(emptyPatchBody.success).toBe(false);
    expect(emptyPatchBody.error.code).toBe('BAD_REQUEST');

    const deleteResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: `/api/v1/trips/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(200);

    const detailAfterDeleteResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${createBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });

    expect(detailAfterDeleteResponse.statusCode).toBe(404);
  });
});

async function registerUser(expressApp: Express, email: string) {
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/auth/register',
    body: {
      email,
      password: 'password123',
      displayName: 'Traveler',
    },
  });
  const body = response.body as {
    data: {
      user: {
        id: string;
      };
      tokens: {
        accessToken: string;
      };
    };
  };

  return {
    accessToken: body.data.tokens.accessToken,
    userId: body.data.user.id,
  };
}
