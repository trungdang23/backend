import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { ITINERARY_REPOSITORY } from '../../../src/modules/itineraries/application/ports/itinerary-repository.port';
import { TRIP_REPOSITORY } from '../../../src/modules/trips/application/ports/trip-repository.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { dispatchRequest } from '../../support/dispatch-request';
import { InMemoryItineraryRepository } from '../../support/in-memory-itinerary.repository';
import { InMemoryTripRepository } from '../../support/in-memory-trip-repository';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

describe('Itineraries integration', () => {
  let app: INestApplication;
  let expressApp: Express;
  let itineraryRepository: InMemoryItineraryRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .overrideProvider(TRIP_REPOSITORY)
      .useClass(InMemoryTripRepository)
      .overrideProvider(ITINERARY_REPOSITORY)
      .useClass(InMemoryItineraryRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();

    expressApp = app.getHttpAdapter().getInstance() as Express;
    itineraryRepository = app.get<InMemoryItineraryRepository>(
      ITINERARY_REPOSITORY,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    itineraryRepository.clear();
  });

  it('adds itinerary days and activities, then calculates the trip budget summary', async () => {
    const traveler = await registerUser(expressApp, 'itinerary@example.com');
    const tripId = await createTrip(expressApp, traveler.accessToken);

    const createDayResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: `/api/v1/trips/${tripId}/itinerary/days`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        date: '2026-06-10',
      },
    });
    const createDayBody = createDayResponse.body as {
      success: boolean;
      data: {
        id: string;
        date: string;
      };
    };

    expect(createDayResponse.statusCode).toBe(201);
    expect(createDayBody.success).toBe(true);
    expect(createDayBody.data.date).toBe('2026-06-10');

    const createActivityResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: `/api/v1/trips/${tripId}/itinerary/days/${createDayBody.data.id}/activities`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        title: 'Dragon Bridge',
        startsAt: '19:00',
        location: 'Da Nang',
        notes: 'Night photos',
        costAmount: 200000,
      },
    });
    const createActivityBody = createActivityResponse.body as {
      success: boolean;
      data: {
        id: string;
        costCurrency: string;
      };
    };

    expect(createActivityResponse.statusCode).toBe(201);
    expect(createActivityBody.success).toBe(true);
    expect(createActivityBody.data.costCurrency).toBe('VND');

    const itineraryResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/itinerary`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const itineraryBody = itineraryResponse.body as {
      success: boolean;
      data: {
        days: Array<{
          activities: Array<{
            id: string;
            title: string;
          }>;
        }>;
      };
    };

    expect(itineraryResponse.statusCode).toBe(200);
    expect(itineraryBody.success).toBe(true);
    expect(itineraryBody.data.days).toHaveLength(1);
    expect(itineraryBody.data.days[0]?.activities[0]?.title).toBe(
      'Dragon Bridge',
    );

    const budgetSummaryResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/budget-summary`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const budgetSummaryBody = budgetSummaryResponse.body as {
      success: boolean;
      data: {
        totalBudgetAmount: number;
        totalPlannedAmount: number;
        remainingAmount: number;
        isOverBudget: boolean;
      };
    };

    expect(budgetSummaryResponse.statusCode).toBe(200);
    expect(budgetSummaryBody.success).toBe(true);
    expect(budgetSummaryBody.data.totalBudgetAmount).toBe(1_000_000);
    expect(budgetSummaryBody.data.totalPlannedAmount).toBe(200_000);
    expect(budgetSummaryBody.data.remainingAmount).toBe(800_000);
    expect(budgetSummaryBody.data.isOverBudget).toBe(false);

    const updateActivityResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/trips/${tripId}/itinerary/days/${createDayBody.data.id}/activities/${createActivityBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        notes: 'Night photos and coffee stop',
        costAmount: 1200000,
      },
    });

    expect(updateActivityResponse.statusCode).toBe(200);

    const overBudgetResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/budget-summary`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const overBudgetBody = overBudgetResponse.body as {
      success: boolean;
      data: {
        totalPlannedAmount: number;
        remainingAmount: number;
        isOverBudget: boolean;
      };
    };

    expect(overBudgetResponse.statusCode).toBe(200);
    expect(overBudgetBody.data.totalPlannedAmount).toBe(1_200_000);
    expect(overBudgetBody.data.remainingAmount).toBe(-200_000);
    expect(overBudgetBody.data.isOverBudget).toBe(true);
  });

  it('rejects itinerary days outside the trip date range', async () => {
    const traveler = await registerUser(
      expressApp,
      'itinerary.invalid-date@example.com',
    );
    const tripId = await createTrip(expressApp, traveler.accessToken);

    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: `/api/v1/trips/${tripId}/itinerary/days`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        date: '2026-06-20',
      },
    });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(response.statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toBe(
      'Itinerary day date must be within the trip date range.',
    );
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
      tokens: {
        accessToken: string;
      };
    };
  };

  return {
    accessToken: body.data.tokens.accessToken,
  };
}

async function createTrip(expressApp: Express, accessToken: string) {
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/trips',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body: {
      name: 'Da Nang Sprint',
      destination: 'Da Nang',
      startDate: '2026-06-10',
      endDate: '2026-06-14',
      timezone: 'Asia/Ho_Chi_Minh',
      budgetAmount: 1000000,
      budgetCurrency: 'VND',
    },
  });
  const body = response.body as {
    data: {
      id: string;
    };
  };

  return body.data.id;
}
