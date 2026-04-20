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
    const firstTraveler = await registerUser(
      expressApp,
      'trips.one@example.com',
    );
    const secondTraveler = await registerUser(
      expressApp,
      'trips.two@example.com',
    );

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
        budgetMode: 'manual',
        manualBudgetAmount: 3500000,
        manualBudgetCurrency: 'vnd',
        visibility: 'private',
      },
    });
    const laterTripBody = laterTripResponse.body as {
      success: boolean;
      data: {
        id: string;
        budgetCurrency: string;
        budgetMode: string;
        manualBudgetAmount: number | null;
        manualBudgetCurrency: string | null;
        visibility: string;
        userId: string;
        summaryNotes: string | null;
        coverImageUrl: string | null;
      };
    };

    expect(laterTripResponse.statusCode).toBe(201);
    expect(laterTripBody.success).toBe(true);
    expect(laterTripBody.data.userId).toBe(firstTraveler.userId);
    expect(laterTripBody.data.budgetCurrency).toBe('VND');
    expect(laterTripBody.data.budgetMode).toBe('manual');
    expect(laterTripBody.data.manualBudgetAmount).toBe(3500000);
    expect(laterTripBody.data.manualBudgetCurrency).toBe('VND');
    expect(laterTripBody.data.visibility).toBe('private');
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
        budgetMode: 'manual',
        manualBudgetAmount: 1000000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
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
        budgetMode: 'auto',
        visibility: 'public',
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
        budgetMode: string;
        manualBudgetAmount: number | null;
        manualBudgetCurrency: string | null;
        visibility: string;
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
      budgetMode: 'manual',
      manualBudgetAmount: 3500000,
      manualBudgetCurrency: 'VND',
      visibility: 'private',
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
        budgetMode: 'manual',
        manualBudgetAmount: 1500000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
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
        budgetMode: 'auto',
        visibility: 'public',
      },
    });
    const updateBody = updateResponse.body as {
      success: boolean;
      data: {
        name: string;
        budgetMode: string;
        manualBudgetAmount: number | null;
        visibility: string;
        summaryNotes: string | null;
        coverImageUrl: string | null;
      };
    };

    expect(updateResponse.statusCode).toBe(200);
    expect(updateBody.success).toBe(true);
    expect(updateBody.data.name).toBe('Hue Discovery Updated');
    expect(updateBody.data.budgetMode).toBe('auto');
    expect(updateBody.data.manualBudgetAmount).toBeNull();
    expect(updateBody.data.visibility).toBe('public');
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

  it('serves public trip detail without auth and blocks private trips', async () => {
    const traveler = await registerUser(expressApp, 'trips.public@example.com');

    const publicTripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Public Hoi An Storyboard',
        startDate: '2026-10-02',
        endDate: '2026-10-05',
        budgetMode: 'manual',
        manualBudgetAmount: 4200000,
        manualBudgetCurrency: 'VND',
        visibility: 'public',
      },
    });
    const publicTripBody = publicTripResponse.body as {
      data: {
        id: string;
      };
    };

    const privateTripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Private Hue Draft',
        startDate: '2026-11-12',
        endDate: '2026-11-14',
        budgetMode: 'manual',
        manualBudgetAmount: 2800000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      },
    });
    const privateTripBody = privateTripResponse.body as {
      data: {
        id: string;
      };
    };

    const detailResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/public/trips/${publicTripBody.data.id}`,
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
    expect(detailBody.data.id).toBe(publicTripBody.data.id);
    expect(detailBody.data.visibility).toBe('public');

    const privateDetailResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/public/trips/${privateTripBody.data.id}`,
    });
    const privateDetailBody = privateDetailResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(privateDetailResponse.statusCode).toBe(403);
    expect(privateDetailBody.success).toBe(false);
    expect(privateDetailBody.error.code).toBe('FORBIDDEN');
    expect(privateDetailBody.error.message).toBe('Trip is private.');

    const missingDetailResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/public/trips/trip-missing',
    });
    const missingDetailBody = missingDetailResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(missingDetailResponse.statusCode).toBe(404);
    expect(missingDetailBody.success).toBe(false);
    expect(missingDetailBody.error.code).toBe('NOT_FOUND');
    expect(missingDetailBody.error.message).toBe('Trip not found.');
  });

  it('lists only public trips without authentication', async () => {
    const traveler = await registerUser(expressApp, 'trips.public.list@example.com');

    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Public Da Lat',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        budgetMode: 'manual',
        manualBudgetAmount: 1800000,
        manualBudgetCurrency: 'VND',
        visibility: 'public',
      },
    });

    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Private Da Nang',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        budgetMode: 'manual',
        manualBudgetAmount: 1500000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      },
    });

    const secondTraveler = await registerUser(
      expressApp,
      'trips.public.list.two@example.com',
    );

    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${secondTraveler.accessToken}`,
      },
      body: {
        name: 'Public Hoi An',
        startDate: '2026-06-11',
        endDate: '2026-06-14',
        budgetMode: 'manual',
        manualBudgetAmount: 2600000,
        manualBudgetCurrency: 'VND',
        visibility: 'public',
      },
    });

    const listResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/public/trips?page=0&size=20&sort=startDate,asc',
    });
    const listBody = listResponse.body as {
      success: boolean;
      data: Array<{
        name: string;
        visibility: string;
      }>;
      meta: {
        totalElements: number;
      };
    };

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.success).toBe(true);
    expect(listBody.data.map((trip) => trip.name)).toEqual([
      'Public Da Lat',
      'Public Hoi An',
    ]);
    expect(listBody.data.every((trip) => trip.visibility === 'public')).toBe(
      true,
    );
    expect(listBody.meta.totalElements).toBe(2);
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
