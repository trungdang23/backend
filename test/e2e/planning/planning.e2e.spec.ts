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

describe('Planning e2e', () => {
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

  it('creates and reads planner nodes through the HTTP app pipeline', async () => {
    const registerResponse = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        email: 'planning.e2e@example.com',
        password: 'password123',
        displayName: 'Planning E2E',
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
        name: 'Planner E2E Trip',
        startDate: '2026-08-01',
        endDate: '2026-08-04',
        budgetMode: 'manual',
        manualBudgetAmount: 2500000,
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

    const createNodeResponse = await request(httpServer)
      .post('/api/v1/nodes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tripId: tripBody.data.id,
        type: 'section',
        title: 'Arrival block',
        sortOrder: 0,
      });
    const createNodeBody = createNodeResponse.body as {
      success: boolean;
      data: {
        id: string;
        depth: number;
      };
    };

    expect(createNodeResponse.statusCode).toBe(201);
    expect(createNodeBody.success).toBe(true);
    expect(createNodeBody.data.depth).toBe(0);

    const plannerResponse = await request(httpServer)
      .get(`/api/v1/trips/${tripBody.data.id}/planner`)
      .set('Authorization', `Bearer ${accessToken}`);
    const plannerBody = plannerResponse.body as {
      success: boolean;
      data: {
        nodes: Array<{
          id: string;
          title: string;
        }>;
      };
    };

    expect(plannerResponse.statusCode).toBe(200);
    expect(plannerBody.success).toBe(true);
    expect(plannerBody.data.nodes).toHaveLength(1);
    expect(plannerBody.data.nodes[0]?.id).toBe(createNodeBody.data.id);
    expect(plannerBody.data.nodes[0]?.title).toBe('Arrival block');
  });

  it('reads a public planner without authentication', async () => {
    const registerResponse = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        email: 'planning.public.e2e@example.com',
        password: 'password123',
        displayName: 'Planning Public E2E',
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
        name: 'Public Planner E2E Trip',
        startDate: '2026-08-10',
        endDate: '2026-08-12',
        budgetMode: 'manual',
        manualBudgetAmount: 2100000,
        manualBudgetCurrency: 'VND',
        visibility: 'public',
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
        type: 'note',
        title: 'Pack extra layers',
        sortOrder: 0,
      });

    const plannerResponse = await request(httpServer).get(
      `/api/v1/public/trips/${tripBody.data.id}/planner`,
    );
    const plannerBody = plannerResponse.body as {
      success: boolean;
      data: {
        trip: {
          id: string;
          visibility: string;
        };
        nodes: Array<{
          title: string;
        }>;
      };
    };

    expect(plannerResponse.statusCode).toBe(200);
    expect(plannerBody.success).toBe(true);
    expect(plannerBody.data.trip.id).toBe(tripBody.data.id);
    expect(plannerBody.data.trip.visibility).toBe('public');
    expect(plannerBody.data.nodes.map((node) => node.title)).toEqual([
      'Pack extra layers',
    ]);
  });
});
