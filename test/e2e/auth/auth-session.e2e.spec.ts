import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

describe('Auth session e2e', () => {
  let app: INestApplication;
  let httpServer: Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
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

  it('registers, logs in, refreshes, logs out, and fetches the current user through HTTP', async () => {
    const registerResponse = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        email: 'e2e@example.com',
        password: 'password123',
        displayName: 'E2E User',
      });
    const registerBody = registerResponse.body as {
      success: boolean;
      data: {
        user: {
          email: string;
        };
        tokens: {
          accessToken: string;
        };
      };
    };

    expect(registerResponse.statusCode).toBe(201);
    expect(registerBody.success).toBe(true);
    expect(registerBody.data.user.email).toBe('e2e@example.com');
    expect(registerBody.data.tokens.accessToken).toEqual(expect.any(String));

    const loginResponse = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({
        email: 'E2E@example.com',
        password: 'password123',
      });
    const loginBody = loginResponse.body as {
      success: boolean;
      data: {
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      };
    };

    expect(loginResponse.statusCode).toBe(200);
    expect(loginBody.success).toBe(true);

    const meResponse = await request(httpServer)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginBody.data.tokens.accessToken}`);
    const meBody = meResponse.body as {
      success: boolean;
      data: {
        user: {
          email: string;
        };
      };
    };

    expect(meResponse.statusCode).toBe(200);
    expect(meBody.success).toBe(true);
    expect(meBody.data.user.email).toBe('e2e@example.com');

    const refreshResponse = await request(httpServer)
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: loginBody.data.tokens.refreshToken,
      });
    const refreshBody = refreshResponse.body as {
      success: boolean;
      data: {
        tokens: {
          accessToken: string;
        };
      };
    };

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshBody.success).toBe(true);
    expect(refreshBody.data.tokens.accessToken).toEqual(expect.any(String));

    const logoutResponse = await request(httpServer)
      .post('/api/v1/auth/logout')
      .send({
        refreshToken: loginBody.data.tokens.refreshToken,
      });
    const logoutBody = logoutResponse.body as {
      success: boolean;
      data: {
        loggedOut: boolean;
      };
    };

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutBody.success).toBe(true);
    expect(logoutBody.data.loggedOut).toBe(true);
  });
});
