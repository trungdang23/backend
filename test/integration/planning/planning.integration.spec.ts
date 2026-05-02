import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { PLAN_NODE_REPOSITORY } from '../../../src/modules/planning/application/ports/plan-node-repository.port';
import { PLAN_NODE_STICKER_REPOSITORY } from '../../../src/modules/planning/application/ports/plan-node-sticker-repository.port';
import { TRIP_REPOSITORY } from '../../../src/modules/trips/application/ports/trip-repository.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { dispatchRequest } from '../../support/dispatch-request';
import { InMemoryPlanNodeRepository } from '../../support/in-memory-plan-node-repository';
import { InMemoryPlanNodeStickerRepository } from '../../support/in-memory-plan-node-sticker-repository';
import { InMemoryTripRepository } from '../../support/in-memory-trip-repository';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

interface ErrorResponseBody {
  success: boolean;
  error: {
    code: string;
    message: string;
  };
}

describe('Planning integration', () => {
  let app: INestApplication;
  let expressApp: Express;
  let tripRepository: InMemoryTripRepository;
  let planNodeRepository: InMemoryPlanNodeRepository;
  let planNodeStickerRepository: InMemoryPlanNodeStickerRepository;

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
      .overrideProvider(PLAN_NODE_STICKER_REPOSITORY)
      .useClass(InMemoryPlanNodeStickerRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();

    expressApp = app.getHttpAdapter().getInstance() as Express;
    tripRepository = app.get<InMemoryTripRepository>(TRIP_REPOSITORY);
    planNodeRepository =
      app.get<InMemoryPlanNodeRepository>(PLAN_NODE_REPOSITORY);
    planNodeStickerRepository = app.get<InMemoryPlanNodeStickerRepository>(
      PLAN_NODE_STICKER_REPOSITORY,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    tripRepository.clear();
    planNodeRepository.clear();
    planNodeStickerRepository.clear();
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
        startAt: '2026-07-12T18:00',
        endAt: '2026-07-12T20:00',
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

  it('rejects activity schedule values outside the trip range or overlapping another activity', async () => {
    const traveler = await registerUser(
      expressApp,
      'planning.schedule@example.com',
    );

    const tripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Timed Planner',
        startDate: '2026-07-12',
        endDate: '2026-07-15',
        budgetMode: 'manual',
        manualBudgetAmount: 3500000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      },
    });
    const tripBody = tripResponse.body as {
      data: {
        id: string;
      };
    };

    const missingTimeResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Untimed activity',
        sortOrder: 0,
      },
    });
    const missingTimeBody = missingTimeResponse.body as ErrorResponseBody;

    expect(missingTimeResponse.statusCode).toBe(400);
    expect(missingTimeBody.success).toBe(false);
    expect(missingTimeBody.error.code).toBe('NODE_VALIDATION_ERROR');
    expect(missingTimeBody.error.message).toBe(
      'Activity start and end times are required.',
    );

    const outsideRangeResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Outside trip range',
        startAt: '2026-07-16T09:00',
        endAt: '2026-07-16T10:00',
        sortOrder: 1,
      },
    });
    const outsideRangeBody = outsideRangeResponse.body as ErrorResponseBody;

    expect(outsideRangeResponse.statusCode).toBe(400);
    expect(outsideRangeBody.error.code).toBe('NODE_VALIDATION_ERROR');
    expect(outsideRangeBody.error.message).toBe(
      'Activity time must be within the trip date range.',
    );

    const equalTimeResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Zero length activity',
        startAt: '2026-07-13T09:00',
        endAt: '2026-07-13T09:00',
        sortOrder: 2,
      },
    });
    const equalTimeBody = equalTimeResponse.body as ErrorResponseBody;

    expect(equalTimeResponse.statusCode).toBe(400);
    expect(equalTimeBody.error.code).toBe('NODE_VALIDATION_ERROR');
    expect(equalTimeBody.error.message).toBe(
      'Activity end time must be after start time.',
    );

    const backwardsTimeResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Backwards activity',
        startAt: '2026-07-13T11:00',
        endAt: '2026-07-13T10:00',
        sortOrder: 3,
      },
    });
    const backwardsTimeBody = backwardsTimeResponse.body as ErrorResponseBody;

    expect(backwardsTimeResponse.statusCode).toBe(400);
    expect(backwardsTimeBody.error.code).toBe('NODE_VALIDATION_ERROR');

    const morningActivityResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Morning cafe',
        startAt: '2026-07-13T09:00',
        endAt: '2026-07-13T10:00',
        sortOrder: 4,
      },
    });
    const morningActivityBody = morningActivityResponse.body as {
      data: {
        id: string;
      };
    };

    expect(morningActivityResponse.statusCode).toBe(201);

    const overlappingCreateResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Overlapping museum',
        startAt: '2026-07-13T09:30',
        endAt: '2026-07-13T10:30',
        sortOrder: 5,
      },
    });
    const overlappingCreateBody =
      overlappingCreateResponse.body as ErrorResponseBody;

    expect(overlappingCreateResponse.statusCode).toBe(400);
    expect(overlappingCreateBody.error.code).toBe('NODE_VALIDATION_ERROR');
    expect(overlappingCreateBody.error.message).toBe(
      'Activity time overlaps another activity in this trip.',
    );

    const adjacentActivityResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Adjacent brunch',
        startAt: '2026-07-13T10:00',
        endAt: '2026-07-13T11:00',
        sortOrder: 6,
      },
    });
    const adjacentActivityBody = adjacentActivityResponse.body as {
      data: {
        id: string;
      };
    };

    expect(adjacentActivityResponse.statusCode).toBe(201);

    const overlappingUpdateResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/nodes/${adjacentActivityBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        startAt: '2026-07-13T09:45',
        endAt: '2026-07-13T10:45',
      },
    });
    const overlappingUpdateBody =
      overlappingUpdateResponse.body as ErrorResponseBody;

    expect(overlappingUpdateResponse.statusCode).toBe(400);
    expect(overlappingUpdateBody.error.code).toBe('NODE_VALIDATION_ERROR');
    expect(overlappingUpdateBody.error.message).toBe(
      'Activity time overlaps another activity in this trip.',
    );

    const outsideRangeUpdateResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/nodes/${morningActivityBody.data.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        startAt: '2026-07-16T09:00',
        endAt: '2026-07-16T10:00',
      },
    });
    const outsideRangeUpdateBody =
      outsideRangeUpdateResponse.body as ErrorResponseBody;

    expect(outsideRangeUpdateResponse.statusCode).toBe(400);
    expect(outsideRangeUpdateBody.error.code).toBe('NODE_VALIDATION_ERROR');
    expect(outsideRangeUpdateBody.error.message).toBe(
      'Activity time must be within the trip date range.',
    );
  });

  it('saves and lists sticker coordinates for a planner node', async () => {
    const traveler = await registerUser(
      expressApp,
      'planning.stickers@example.com',
    );

    const tripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Sticker Planner',
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        budgetMode: 'manual',
        manualBudgetAmount: 1800000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      },
    });
    const tripBody = tripResponse.body as {
      data: {
        id: string;
      };
    };

    const nodeResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Cafe hopping',
        startAt: '2026-10-01T09:00',
        endAt: '2026-10-01T11:00',
        sortOrder: 0,
      },
    });
    const nodeBody = nodeResponse.body as {
      data: {
        id: string;
      };
    };

    const saveStickersResponse = await dispatchRequest(expressApp, {
      method: 'PUT',
      path: `/api/v1/nodes/${nodeBody.data.id}/stickers`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        stickers: [
          {
            stickerKey: 'sun',
            x: 2400,
            y: 1800,
            rotation: -12,
            scale: 110,
            zIndex: 2,
          },
          {
            stickerKey: 'camera',
            x: 7600,
            y: 6100,
            rotation: 8,
            scale: 95,
            zIndex: 1,
          },
        ],
      },
    });
    const saveStickersBody = saveStickersResponse.body as {
      success: boolean;
      data: Array<{
        stickerKey: string;
        x: number;
        y: number;
        zIndex: number;
      }>;
    };

    expect(saveStickersResponse.statusCode).toBe(200);
    expect(saveStickersBody.success).toBe(true);
    expect(saveStickersBody.data.map((sticker) => sticker.stickerKey)).toEqual([
      'camera',
      'sun',
    ]);

    const getStickersResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/nodes/${nodeBody.data.id}/stickers`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const getStickersBody = getStickersResponse.body as {
      success: boolean;
      data: Array<{
        stickerKey: string;
        x: number;
        y: number;
      }>;
    };

    expect(getStickersResponse.statusCode).toBe(200);
    expect(getStickersBody.success).toBe(true);
    expect(getStickersBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stickerKey: 'camera',
          x: 7600,
          y: 6100,
        }),
        expect.objectContaining({
          stickerKey: 'sun',
          x: 2400,
          y: 1800,
        }),
      ]),
    );
  });

  it('serves a public planner without auth and blocks private planners', async () => {
    const traveler = await registerUser(
      expressApp,
      'planning.public@example.com',
    );

    const publicTripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Public Planner',
        startDate: '2026-09-01',
        endDate: '2026-09-04',
        budgetMode: 'manual',
        manualBudgetAmount: 3200000,
        manualBudgetCurrency: 'VND',
        visibility: 'public',
      },
    });
    const publicTripBody = publicTripResponse.body as {
      data: {
        id: string;
      };
    };

    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/nodes',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        tripId: publicTripBody.data.id,
        type: 'day',
        title: 'Public day one',
        sortOrder: 0,
      },
    });

    const privateTripResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        name: 'Private Planner',
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        budgetMode: 'manual',
        manualBudgetAmount: 2500000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      },
    });
    const privateTripBody = privateTripResponse.body as {
      data: {
        id: string;
      };
    };

    const plannerResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/public/trips/${publicTripBody.data.id}/planner`,
    });
    const plannerBody = plannerResponse.body as {
      success: boolean;
      data: {
        trip: {
          id: string;
        };
        nodes: Array<{
          title: string;
        }>;
      };
    };

    expect(plannerResponse.statusCode).toBe(200);
    expect(plannerBody.success).toBe(true);
    expect(plannerBody.data.trip.id).toBe(publicTripBody.data.id);
    expect(plannerBody.data.nodes.map((node) => node.title)).toEqual([
      'Public day one',
    ]);

    const privatePlannerResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/public/trips/${privateTripBody.data.id}/planner`,
    });
    const privatePlannerBody = privatePlannerResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(privatePlannerResponse.statusCode).toBe(403);
    expect(privatePlannerBody.success).toBe(false);
    expect(privatePlannerBody.error.code).toBe('PERMISSION_DENIED');
    expect(privatePlannerBody.error.message).toBe('Trip is private.');

    const missingPlannerResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/public/trips/trip-missing/planner',
    });
    const missingPlannerBody = missingPlannerResponse.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(missingPlannerResponse.statusCode).toBe(404);
    expect(missingPlannerBody.success).toBe(false);
    expect(missingPlannerBody.error.code).toBe('TRIP_NOT_FOUND');
    expect(missingPlannerBody.error.message).toBe('Trip not found.');
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
