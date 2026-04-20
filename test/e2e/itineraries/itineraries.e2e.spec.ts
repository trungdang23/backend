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

describe('Itineraries e2e', () => {
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
      .overrideProvider(ITINERARY_REPOSITORY)
      .useClass(InMemoryItineraryRepository)
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

  it('adds an itinerary day and activity through the HTTP app pipeline', async () => {
    const registerResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'itineraries.e2e@example.com',
        password: 'password123',
        displayName: 'Itinerary E2E',
      },
    });
    const registerBody = registerResponse.body as {
      data: {
        tokens: {
          accessToken: string;
        };
      };
    };
    const accessToken = registerBody.data.tokens.accessToken;

    const createTripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        name: 'Hoi An Lights',
        destination: 'Hoi An',
        startDate: '2026-07-12',
        endDate: '2026-07-15',
        timezone: 'Asia/Ho_Chi_Minh',
        budgetAmount: 2000000,
        budgetCurrency: 'VND',
      },
    });
    const createTripBody = createTripResponse.body as {
      data: {
        id: string;
      };
    };

    const createDayResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: `/api/v1/trips/${createTripBody.data.id}/itinerary/days`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        date: '2026-07-12',
        title: 'Hoi An center',
        location: 'Hoi An Old Town',
        costAmount: 300000,
        imageUrls: ['https://images.example.com/hoi-an-center.jpg'],
      },
    });
    const createDayBody = createDayResponse.body as {
      success: boolean;
      data: {
        id: string;
      };
    };

    expect(createDayResponse.statusCode).toBe(201);
    expect(createDayBody.success).toBe(true);

    const createActivityResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: `/api/v1/trips/${createTripBody.data.id}/itinerary/days/${createDayBody.data.id}/activities`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        title: 'Lantern Walk',
        startsAt: '18:30',
        endsAt: '20:00',
        location: 'Hoi An Old Town',
        costAmount: 250000,
        imageUrls: ['https://images.example.com/lantern-walk.jpg'],
      },
    });

    expect(createActivityResponse.statusCode).toBe(201);

    const itineraryResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${createTripBody.data.id}/itinerary`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const itineraryBody = itineraryResponse.body as {
      success: boolean;
      data: {
        days: Array<{
          title: string;
          activities: Array<{
            title: string;
          }>;
        }>;
      };
    };

    expect(itineraryResponse.statusCode).toBe(200);
    expect(itineraryBody.success).toBe(true);
    expect(itineraryBody.data.days).toHaveLength(1);
    expect(itineraryBody.data.days[0]?.title).toBe('Hoi An center');
    expect(itineraryBody.data.days[0]?.activities[0]?.title).toBe('Lantern Walk');
  });
});
