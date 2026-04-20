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

  it('adds, updates, and deletes itinerary days and activities through the legacy bridge routes', async () => {
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
        title: 'Da Nang arrival',
        location: 'Da Nang',
        costAmount: 150000,
        imageUrls: ['https://images.example.com/da-nang-arrival.jpg'],
      },
    });
    const createDayBody = createDayResponse.body as {
      success: boolean;
      data: {
        id: string;
        date: string;
        title: string;
        imageUrls: string[];
      };
    };

    expect(createDayResponse.statusCode).toBe(201);
    expect(createDayBody.success).toBe(true);
    expect(createDayBody.data.date).toBe('2026-06-10');
    expect(createDayBody.data.title).toBe('Da Nang arrival');
    expect(createDayBody.data.imageUrls).toHaveLength(1);

    const createActivityResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: `/api/v1/trips/${tripId}/itinerary/days/${createDayBody.data.id}/activities`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        title: 'Dragon Bridge',
        startsAt: '19:00',
        endsAt: '21:00',
        location: 'Da Nang',
        notes: 'Night photos',
        costAmount: 200000,
        imageUrls: ['https://images.example.com/dragon-bridge-1.jpg'],
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
          title: string;
          costAmount: number;
          imageUrls: string[];
          activities: Array<{
            id: string;
            title: string;
            endsAt: string | null;
            imageUrls: string[];
          }>;
        }>;
      };
    };

    expect(itineraryResponse.statusCode).toBe(200);
    expect(itineraryBody.success).toBe(true);
    expect(itineraryBody.data.days).toHaveLength(1);
    expect(itineraryBody.data.days[0]?.title).toBe('Da Nang arrival');
    expect(itineraryBody.data.days[0]?.costAmount).toBe(150000);
    expect(itineraryBody.data.days[0]?.imageUrls).toHaveLength(1);
    expect(itineraryBody.data.days[0]?.activities[0]?.title).toBe(
      'Dragon Bridge',
    );
    expect(itineraryBody.data.days[0]?.activities[0]?.endsAt).toBe('21:00');
    expect(itineraryBody.data.days[0]?.activities[0]?.imageUrls).toHaveLength(1);

    const updateActivityResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/trips/${tripId}/itinerary/days/${createDayBody.data.id}/activities/${createActivityBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        notes: 'Night photos and coffee stop',
        costAmount: 1200000,
        imageUrls: ['https://images.example.com/dragon-bridge-2.jpg'],
      },
    });

    expect(updateActivityResponse.statusCode).toBe(200);

    const updateDayResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/trips/${tripId}/itinerary/days/${createDayBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        title: 'Da Nang downtown',
        costAmount: 175000,
      },
    });

    expect(updateDayResponse.statusCode).toBe(200);

    const deleteActivityResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: `/api/v1/trips/${tripId}/itinerary/days/${createDayBody.data.id}/activities/${createActivityBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });

    expect(deleteActivityResponse.statusCode).toBe(204);

    const deleteDayResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: `/api/v1/trips/${tripId}/itinerary/days/${createDayBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });

    expect(deleteDayResponse.statusCode).toBe(204);
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
        title: 'Outside range',
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
