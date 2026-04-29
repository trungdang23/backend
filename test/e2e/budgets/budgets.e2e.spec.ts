import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { PLAN_NODE_REPOSITORY } from '../../../src/modules/planning/application/ports/plan-node-repository.port';
import { TRIP_REPOSITORY } from '../../../src/modules/trips/application/ports/trip-repository.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { InMemoryPlanNodeRepository } from '../../support/in-memory-plan-node-repository';
import { InMemoryTripRepository } from '../../support/in-memory-trip-repository';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

describe('Budgets e2e', () => {
  let app: INestApplication;
  let httpServer: Parameters<typeof request>[0];

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

    httpServer = app.getHttpServer() as Parameters<typeof request>[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns planner-based manual budget summary through the HTTP app pipeline', async () => {
    const registerResponse = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        email: 'budgets.e2e@example.com',
        password: 'password123',
        displayName: 'Budget E2E',
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

    const tripResponse = await request(httpServer)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Budget E2E Trip',
        startDate: '2026-08-01',
        endDate: '2026-08-04',
        budgetMode: 'manual',
        manualBudgetAmount: 2_500_000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      });
    const tripBody = tripResponse.body as {
      success: boolean;
      data: {
        id: string;
      };
    };

    expect(tripResponse.statusCode).toBe(201);
    expect(tripBody.success).toBe(true);

    await request(httpServer)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tripId: tripBody.data.id,
        type: 'day',
        title: 'Arrival day',
        costAmount: 200_000,
        costCurrency: 'VND',
        sortOrder: 0,
      })
      .expect(201);

    await request(httpServer)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Dinner',
        startAt: '2026-08-01T18:00',
        endAt: '2026-08-01T20:00',
        costAmount: 350_000,
        costCurrency: 'VND',
        sortOrder: 1,
      })
      .expect(201);

    const budgetSummaryResponse = await request(httpServer)
      .get(`/api/v1/trips/${tripBody.data.id}/budget-summary`)
      .set('Authorization', `Bearer ${accessToken}`);
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
      totalBudgetAmount: 2_500_000,
      totalPlannedAmount: 550_000,
      remainingAmount: 1_950_000,
      totalDays: 1,
      totalActivities: 1,
      hasMixedCurrencies: false,
      totalsByCurrency: [
        {
          currency: 'VND',
          plannedAmount: 550_000,
          nodeCount: 2,
        },
      ],
    });
  });

  it('returns additive currency breakdown for auto mode when planner costs span multiple currencies', async () => {
    const registerResponse = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        email: 'budgets.mixed.e2e@example.com',
        password: 'password123',
        displayName: 'Budget Mixed E2E',
      });
    const registerBody = registerResponse.body as {
      data: {
        tokens: {
          accessToken: string;
        };
      };
    };

    const accessToken = registerBody.data.tokens.accessToken;

    const tripResponse = await request(httpServer)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Budget Mixed Trip',
        startDate: '2026-08-10',
        endDate: '2026-08-12',
        budgetMode: 'auto',
        visibility: 'private',
      });
    const tripBody = tripResponse.body as {
      data: {
        id: string;
      };
    };

    await request(httpServer)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tripId: tripBody.data.id,
        type: 'day',
        title: 'Local transit',
        costAmount: 300_000,
        costCurrency: 'VND',
        sortOrder: 0,
      })
      .expect(201);

    await request(httpServer)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Museum pass',
        startAt: '2026-08-10T09:00',
        endAt: '2026-08-10T11:00',
        costAmount: 25,
        costCurrency: 'USD',
        sortOrder: 1,
      })
      .expect(201);

    const budgetSummaryResponse = await request(httpServer)
      .get(`/api/v1/trips/${tripBody.data.id}/budget-summary`)
      .set('Authorization', `Bearer ${accessToken}`);
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

  it('recomputes the summary after planner node update and delete mutations through the HTTP app pipeline', async () => {
    const registerResponse = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        email: 'budgets.mutation.e2e@example.com',
        password: 'password123',
        displayName: 'Budget Mutation E2E',
      });
    const registerBody = registerResponse.body as {
      data: {
        tokens: {
          accessToken: string;
        };
      };
    };

    const accessToken = registerBody.data.tokens.accessToken;

    const tripResponse = await request(httpServer)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Budget Mutation Trip',
        startDate: '2026-08-15',
        endDate: '2026-08-18',
        budgetMode: 'manual',
        manualBudgetAmount: 4_200_000,
        manualBudgetCurrency: 'VND',
        visibility: 'private',
      });
    const tripBody = tripResponse.body as {
      data: {
        id: string;
      };
    };

    await request(httpServer)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tripId: tripBody.data.id,
        type: 'day',
        title: 'Ngày 1 ở Huế',
        costAmount: 600_000,
        costCurrency: 'VND',
        sortOrder: 0,
      })
      .expect(201);

    const createChildResponse = await request(httpServer)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tripId: tripBody.data.id,
        type: 'activity',
        title: 'Workshop ngoại tệ',
        startAt: '2026-08-15T09:00',
        endAt: '2026-08-15T11:00',
        costAmount: 25,
        costCurrency: 'USD',
        sortOrder: 1,
      })
      .expect(201);
    const createChildBody = createChildResponse.body as {
      data: {
        id: string;
      };
    };

    const initialBudgetSummaryResponse = await request(httpServer)
      .get(`/api/v1/trips/${tripBody.data.id}/budget-summary`)
      .set('Authorization', `Bearer ${accessToken}`);
    const initialBudgetSummaryBody = initialBudgetSummaryResponse.body as {
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

    expect(initialBudgetSummaryResponse.statusCode).toBe(200);
    expect(initialBudgetSummaryBody.success).toBe(true);
    expect(initialBudgetSummaryBody.data).toMatchObject({
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

    await request(httpServer)
      .patch(`/api/v1/nodes/${createChildBody.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Bữa tối sông Hương',
        costAmount: 200_000,
        costCurrency: 'VND',
      })
      .expect(200);

    const updatedBudgetSummaryResponse = await request(httpServer)
      .get(`/api/v1/trips/${tripBody.data.id}/budget-summary`)
      .set('Authorization', `Bearer ${accessToken}`);
    const updatedBudgetSummaryBody = updatedBudgetSummaryResponse.body as {
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

    expect(updatedBudgetSummaryResponse.statusCode).toBe(200);
    expect(updatedBudgetSummaryBody.success).toBe(true);
    expect(updatedBudgetSummaryBody.data).toMatchObject({
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

    await request(httpServer)
      .delete(`/api/v1/nodes/${createChildBody.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const budgetSummaryAfterDeleteResponse = await request(httpServer)
      .get(`/api/v1/trips/${tripBody.data.id}/budget-summary`)
      .set('Authorization', `Bearer ${accessToken}`);
    const budgetSummaryAfterDeleteBody =
      budgetSummaryAfterDeleteResponse.body as {
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

    expect(budgetSummaryAfterDeleteResponse.statusCode).toBe(200);
    expect(budgetSummaryAfterDeleteBody.success).toBe(true);
    expect(budgetSummaryAfterDeleteBody.data).toMatchObject({
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
