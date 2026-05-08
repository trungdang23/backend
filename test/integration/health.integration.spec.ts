import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { AppModule } from '../../src/app/app.module';
import { CORRELATION_ID_HEADER } from '../../src/app/request-context/request-context';
import { setupApp } from '../../src/app/bootstrap/setup-app';
import { dispatchRequest } from '../support/dispatch-request';

describe('Health integration', () => {
  let app: INestApplication;
  let expressApp: Express;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);

    setupApp(app);
    await app.init();
    expressApp = app.getHttpAdapter().getInstance() as Express;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('returns the health snapshot in the shared success envelope', async () => {
    const response = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/health',
    });
    const body = response.body as {
      success: boolean;
      data: {
        status: string;
        service: string;
        environment: string;
        version: string;
        releaseSha: string | null;
        timestamp: string;
        checks: {
          database: {
            status: string;
          };
        };
      };
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.service).toBe('journey-backend');
    expect(body.data.environment).toBe('test');
    expect(body.data.version).toBe('0.1.0');
    expect(body.data.releaseSha).toBeNull();
    expect(body.data.timestamp).toEqual(expect.any(String));
    expect(body.data.checks.database.status).toBe('up');
    expect(response.headers[CORRELATION_ID_HEADER]).toEqual(expect.any(String));
  });

  it('echoes a client provided correlation id', async () => {
    const response = await dispatchRequest(expressApp, {
      headers: {
        [CORRELATION_ID_HEADER]: 'journey-correlation-id',
      },
      method: 'GET',
      path: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers[CORRELATION_ID_HEADER]).toBe(
      'journey-correlation-id',
    );
  });

  it('returns the shared error envelope for unknown routes', async () => {
    const response = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/not-found',
    });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
        path: string;
        timestamp: string;
      };
    };

    expect(response.statusCode).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toEqual(expect.any(String));
    expect(body.error.path).toBe('/api/v1/not-found');
    expect(body.error.timestamp).toEqual(expect.any(String));
  });
});
