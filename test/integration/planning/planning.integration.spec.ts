import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { PLAN_NODE_REPOSITORY } from '../../../src/modules/planning/application/ports/plan-node-repository.port';
import { TRIP_REPOSITORY } from '../../../src/modules/trips/application/ports/trip-repository.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { dispatchRequest } from '../../support/dispatch-request';
import { InMemoryPlanNodeRepository } from '../../support/in-memory-plan-node-repository';
import { InMemoryTripRepository } from '../../support/in-memory-trip-repository';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

describe('Planning integration', () => {
  let app: INestApplication;
  let expressApp: Express;
  let tripRepository: InMemoryTripRepository;
  let planNodeRepository: InMemoryPlanNodeRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .overrideProvider(TRIP_REPOSITORY)
      .useClass(InMemoryTripRepository)
      .overrideProvider(PLAN_NODE_REPOSITORY)
      .useClass(InMemoryPlanNodeRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();

    expressApp = app.getHttpAdapter().getInstance() as Express;
    tripRepository = app.get<InMemoryTripRepository>(TRIP_REPOSITORY);
    planNodeRepository = app.get<InMemoryPlanNodeRepository>(PLAN_NODE_REPOSITORY);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    tripRepository.clear();
    planNodeRepository.clear();
  });

  it('creates, updates, lists, and cascade deletes planner nodes for the authenticated user', async () => {
    const traveler = await registerUser(expressApp, 'planning@example.com');

    const tripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Da Lat Planner',
        startDate: '2026-07-12',
        endDate: '2026-07-15',
        budgetMode: 'manual',
        manualBudgetAmount: 5000000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      },
    });
    const tripBody = tripResponse.body as {
      data: {
        id: string;
      };
    };

    const rootNodeResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'day',
        title: 'Arrival day',
        startAt: '2026-07-12T09:00',
        endAt: '2026-07-12T21:00',
        sortOrder: 0,
      },
    });
    const rootNodeBody = rootNodeResponse.body as {
      success: boolean;
      data: {
        id: string;
        depth: number;
        title: string;
      };
    };

    expect(rootNodeResponse.statusCode).toBe(201);
    expect(rootNodeBody.success).toBe(true);
    expect(rootNodeBody.data.depth).toBe(0);

    const childNodeResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        parentId: rootNodeBody.data.id,
        type: 'activity',
        title: 'Night market walk',
        costAmount: 150000,
        costCurrency: 'vnd',
        sortOrder: 0,
      },
    });
    const childNodeBody = childNodeResponse.body as {
      success: boolean;
      data: {
        id: string;
        depth: number;
        costCurrency: string | null;
      };
    };

    expect(childNodeResponse.statusCode).toBe(201);
    expect(childNodeBody.data.depth).toBe(1);
    expect(childNodeBody.data.costCurrency).toBe('VND');

    const updateNodeResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/nodes/${childNodeBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        notes: 'Bring cash for snacks.',
        imageUrl: 'https://images.example.com/night-market.jpg',
      },
    });
    const updateNodeBody = updateNodeResponse.body as {
      success: boolean;
      data: {
        notes: string | null;
        imageUrl: string | null;
      };
    };

    expect(updateNodeResponse.statusCode).toBe(200);
    expect(updateNodeBody.data.notes).toBe('Bring cash for snacks.');
    expect(updateNodeBody.data.imageUrl).toBe(
      'https://images.example.com/night-market.jpg',
    );

    const plannerResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripBody.data.id}/planner`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const plannerBody = plannerResponse.body as {
      success: boolean;
      data: {
        trip: {
          id: string;
        };
        nodes: Array<{
          id: string;
          title: string;
        }>;
      };
    };

    expect(plannerResponse.statusCode).toBe(200);
    expect(plannerBody.success).toBe(true);
    expect(plannerBody.data.trip.id).toBe(tripBody.data.id);
    expect(plannerBody.data.nodes.map((node) => node.title)).toEqual([
      'Arrival day',
      'Night market walk',
    ]);

    const deleteRootResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: `/api/v1/nodes/${rootNodeBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });

    expect(deleteRootResponse.statusCode).toBe(204);

    const plannerAfterDeleteResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripBody.data.id}/planner`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const plannerAfterDeleteBody = plannerAfterDeleteResponse.body as {
      success: boolean;
      data: {
        nodes: unknown[];
      };
    };

    expect(plannerAfterDeleteResponse.statusCode).toBe(200);
    expect(plannerAfterDeleteBody.success).toBe(true);
    expect(plannerAfterDeleteBody.data.nodes).toHaveLength(0);
  });
});

async function registerUser(expressApp: Express, email: string) {
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/auth/register',
    body: {
      email,
      password: 'password123',
      displayName: 'Planner User',
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
    throw new Error(`Failed to register user ${email}.`);
  }

  return {
    userId: body.data.user.id,
    accessToken: body.data.tokens.accessToken,
  };
}
