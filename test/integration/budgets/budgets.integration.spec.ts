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

describe('Budgets integration', () => {
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
    planNodeRepository =
      app.get<InMemoryPlanNodeRepository>(PLAN_NODE_REPOSITORY);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    tripRepository.clear();
    planNodeRepository.clear();
  });

  it('returns a manual budget summary from planner nodes instead of the itinerary bridge', async () => {
    const traveler = await registerUser(
      expressApp,
      'budgets.manual@example.com',
    );
    const tripId = await createTrip(expressApp, traveler.accessToken, {
      name: 'Planner Budget Manual',
      budgetMode: 'manual',
      manualBudgetAmount: 5_000_000,
      manualBudgetCurrency: 'VND',
    });

    await createPlanNode(expressApp, traveler.accessToken, {
      tripId,
      type: 'day',
      title: 'Arrival day',
      costAmount: 150_000,
      costCurrency: 'VND',
      sortOrder: 0,
    });
    await createPlanNode(expressApp, traveler.accessToken, {
      tripId,
      type: 'activity',
      title: 'Night market walk',
      costAmount: 200_000,
      costCurrency: 'VND',
      sortOrder: 1,
    });

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
        currency: string;
        totalBudgetAmount: number;
        totalPlannedAmount: number;
        remainingAmount: number;
        totalDays: number;
        totalActivities: number;
        hasMixedCurrencies: boolean;
        totalsByCurrency: Array<{
          currency: string;
          plannedAmount: number;
          nodeCount: number;
        }>;
      };
    };

    expect(budgetSummaryResponse.statusCode).toBe(200);
    expect(budgetSummaryBody.success).toBe(true);
    expect(budgetSummaryBody.data).toMatchObject({
      currency: 'VND',
      totalBudgetAmount: 5_000_000,
      totalPlannedAmount: 350_000,
      remainingAmount: 4_650_000,
      totalDays: 1,
      totalActivities: 1,
      hasMixedCurrencies: false,
      totalsByCurrency: [
        {
          currency: 'VND',
          plannedAmount: 350_000,
          nodeCount: 2,
        },
      ],
    });
  });

  it('returns additive mixed-currency breakdown for auto mode while keeping compatibility fields stable', async () => {
    const traveler = await registerUser(expressApp, 'budgets.auto@example.com');
    const tripId = await createTrip(expressApp, traveler.accessToken, {
      name: 'Planner Budget Auto',
      budgetMode: 'auto',
    });

    await createPlanNode(expressApp, traveler.accessToken, {
      tripId,
      type: 'day',
      title: 'Budgeted day',
      costAmount: 300_000,
      costCurrency: 'VND',
      sortOrder: 0,
    });
    await createPlanNode(expressApp, traveler.accessToken, {
      tripId,
      type: 'activity',
      title: 'Museum ticket',
      costAmount: 25,
      costCurrency: 'USD',
      sortOrder: 1,
    });

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
        currency: string;
        totalBudgetAmount: number;
        totalPlannedAmount: number;
        remainingAmount: number;
        totalDays: number;
        totalActivities: number;
        isOverBudget: boolean;
        hasMixedCurrencies: boolean;
        totalsByCurrency: Array<{
          currency: string;
          plannedAmount: number;
          nodeCount: number;
        }>;
      };
    };

    expect(budgetSummaryResponse.statusCode).toBe(200);
    expect(budgetSummaryBody.success).toBe(true);
    expect(budgetSummaryBody.data).toMatchObject({
      currency: 'VND',
      totalBudgetAmount: 300_000,
      totalPlannedAmount: 300_000,
      remainingAmount: 0,
      totalDays: 1,
      totalActivities: 1,
      isOverBudget: false,
      hasMixedCurrencies: true,
      totalsByCurrency: [
        {
          currency: 'VND',
          plannedAmount: 300_000,
          nodeCount: 1,
        },
        {
          currency: 'USD',
          plannedAmount: 25,
          nodeCount: 1,
        },
      ],
    });
  });

  it('recomputes the budget summary after planner node update and delete mutations', async () => {
    const traveler = await registerUser(
      expressApp,
      'budgets.mutation@example.com',
    );
    const tripId = await createTrip(expressApp, traveler.accessToken, {
      name: 'Planner Budget Mutation',
      budgetMode: 'manual',
      manualBudgetAmount: 4_200_000,
      manualBudgetCurrency: 'VND',
    });

    await createPlanNode(expressApp, traveler.accessToken, {
      tripId,
      type: 'day',
      title: 'Ngày 1 ở Huế',
      costAmount: 600_000,
      costCurrency: 'VND',
      sortOrder: 0,
    });
    const childNodeId = await createPlanNode(expressApp, traveler.accessToken, {
      tripId,
      type: 'activity',
      title: 'Workshop ngoại tệ',
      costAmount: 25,
      costCurrency: 'USD',
      sortOrder: 1,
    });

    const initialBudgetSummary = await getBudgetSummary(
      expressApp,
      traveler.accessToken,
      tripId,
    );

    expect(initialBudgetSummary).toMatchObject({
      currency: 'VND',
      totalBudgetAmount: 4_200_000,
      totalPlannedAmount: 600_000,
      remainingAmount: 3_600_000,
      totalDays: 1,
      totalActivities: 1,
      isOverBudget: false,
      hasMixedCurrencies: true,
      totalsByCurrency: [
        {
          currency: 'VND',
          plannedAmount: 600_000,
          nodeCount: 1,
        },
        {
          currency: 'USD',
          plannedAmount: 25,
          nodeCount: 1,
        },
      ],
    });

    await updatePlanNode(expressApp, traveler.accessToken, childNodeId, {
      title: 'Bữa tối sông Hương',
      costAmount: 200_000,
      costCurrency: 'VND',
    });

    const updatedBudgetSummary = await getBudgetSummary(
      expressApp,
      traveler.accessToken,
      tripId,
    );

    expect(updatedBudgetSummary).toMatchObject({
      currency: 'VND',
      totalBudgetAmount: 4_200_000,
      totalPlannedAmount: 800_000,
      remainingAmount: 3_400_000,
      totalDays: 1,
      totalActivities: 1,
      isOverBudget: false,
      hasMixedCurrencies: false,
      totalsByCurrency: [
        {
          currency: 'VND',
          plannedAmount: 800_000,
          nodeCount: 2,
        },
      ],
    });

    await deletePlanNode(expressApp, traveler.accessToken, childNodeId);

    const budgetSummaryAfterDelete = await getBudgetSummary(
      expressApp,
      traveler.accessToken,
      tripId,
    );

    expect(budgetSummaryAfterDelete).toMatchObject({
      currency: 'VND',
      totalBudgetAmount: 4_200_000,
      totalPlannedAmount: 600_000,
      remainingAmount: 3_600_000,
      totalDays: 1,
      totalActivities: 0,
      isOverBudget: false,
      hasMixedCurrencies: false,
      totalsByCurrency: [
        {
          currency: 'VND',
          plannedAmount: 600_000,
          nodeCount: 1,
        },
      ],
    });
  });
});

async function registerUser(expressApp: Express, email: string) {
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/auth/register',
    body: {
      email,
      password: 'password123',
      displayName: 'Budget Traveler',
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

async function createTrip(
  expressApp: Express,
  accessToken: string,
  body: {
    name: string;
    budgetMode: 'auto' | 'manual';
    manualBudgetAmount?: number;
    manualBudgetCurrency?: string;
  },
) {
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/trips',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body: {
      name: body.name,
      startDate: '2026-07-12',
      endDate: '2026-07-15',
      visibility: 'private',
      budgetMode: body.budgetMode,
      manualBudgetAmount: body.manualBudgetAmount,
      manualBudgetCurrency: body.manualBudgetCurrency,
    },
  });
  const responseBody = response.body as {
    data: {
      id: string;
    };
  };

  return responseBody.data.id;
}

async function createPlanNode(
  expressApp: Express,
  accessToken: string,
  body: {
    tripId: string;
    type: string;
    title: string;
    startAt?: string;
    endAt?: string;
    costAmount: number;
    costCurrency: string;
    sortOrder: number;
  },
) {
  const requestBody =
    body.type === 'activity'
      ? {
          startAt: '2026-07-12T09:00',
          endAt: '2026-07-12T10:00',
          ...body,
        }
      : body;
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/nodes',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body: requestBody,
  });
  const responseBody = response.body as {
    data: {
      id: string;
    };
  };

  expect(response.statusCode).toBe(201);

  return responseBody.data.id;
}

async function updatePlanNode(
  expressApp: Express,
  accessToken: string,
  nodeId: string,
  body: {
    title?: string;
    costAmount?: number | null;
    costCurrency?: string | null;
  },
) {
  const response = await dispatchRequest(expressApp, {
    method: 'PATCH',
    path: `/api/v1/nodes/${nodeId}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body,
  });

  expect(response.statusCode).toBe(200);
}

async function deletePlanNode(
  expressApp: Express,
  accessToken: string,
  nodeId: string,
) {
  const response = await dispatchRequest(expressApp, {
    method: 'DELETE',
    path: `/api/v1/nodes/${nodeId}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  expect(response.statusCode).toBe(204);
}

async function getBudgetSummary(
  expressApp: Express,
  accessToken: string,
  tripId: string,
) {
  const budgetSummaryResponse = await dispatchRequest(expressApp, {
    method: 'GET',
    path: `/api/v1/trips/${tripId}/budget-summary`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
  const budgetSummaryBody = budgetSummaryResponse.body as {
    success: boolean;
    data: {
      currency: string;
      totalBudgetAmount: number;
      totalPlannedAmount: number;
      remainingAmount: number;
      totalDays: number;
      totalActivities: number;
      isOverBudget: boolean;
      hasMixedCurrencies: boolean;
      totalsByCurrency: Array<{
        currency: string;
        plannedAmount: number;
        nodeCount: number;
      }>;
    };
  };

  expect(budgetSummaryResponse.statusCode).toBe(200);
  expect(budgetSummaryBody.success).toBe(true);

  return budgetSummaryBody.data;
}
