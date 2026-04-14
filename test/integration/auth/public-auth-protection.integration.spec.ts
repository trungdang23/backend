import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { PublicAuthRateLimitService } from '../../../src/modules/auth/presentation/public-auth-rate-limit.service';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

describe('Public auth protection integration', () => {
  const originalEnv = process.env;
  let app: INestApplication;
  let httpServer: Parameters<typeof request>[0];
  let publicAuthRateLimitService: PublicAuthRateLimitService;

  beforeAll(async () => {
    process.env = {
      ...originalEnv,
      CORS_ALLOWED_ORIGINS: 'https://buicojourney.com',
      AUTH_RATE_LIMIT_MAX_REQUESTS: '2',
      AUTH_RATE_LIMIT_WINDOW_SECONDS: '60',
    };

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
    publicAuthRateLimitService = app.get(PublicAuthRateLimitService);
  });

  afterEach(() => {
    publicAuthRateLimitService.reset();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  it('returns CORS headers for an allowed auth preflight request', async () => {
    const response = await request(httpServer)
      .options('/api/v1/auth/login')
      .set('Origin', 'https://buicojourney.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(
      'https://buicojourney.com',
    );
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain(
      'Authorization',
    );
  });

  it('rate limits repeated login attempts from the same client ip', async () => {
    await request(httpServer).post('/api/v1/auth/register').send({
      email: 'limit@example.com',
      password: 'password123',
      displayName: 'Rate Limited User',
    });

    const firstResponse = await request(httpServer)
      .post('/api/v1/auth/login')
      .set('CF-Connecting-IP', '203.0.113.10')
      .send({
        email: 'limit@example.com',
        password: 'bad-password',
      });

    const secondResponse = await request(httpServer)
      .post('/api/v1/auth/login')
      .set('CF-Connecting-IP', '203.0.113.10')
      .send({
        email: 'limit@example.com',
        password: 'bad-password',
      });

    const thirdResponse = await request(httpServer)
      .post('/api/v1/auth/login')
      .set('CF-Connecting-IP', '203.0.113.10')
      .send({
        email: 'limit@example.com',
        password: 'bad-password',
      });
    const thirdBody = thirdResponse.body as {
      error: {
        code: string;
        message: string;
      };
      success: boolean;
    };

    expect(firstResponse.statusCode).toBe(401);
    expect(secondResponse.statusCode).toBe(401);
    expect(thirdResponse.statusCode).toBe(429);
    expect(thirdBody.success).toBe(false);
    expect(thirdBody.error.code).toBe('TOO_MANY_REQUESTS');
    expect(thirdBody.error.message).toBe(
      'Too many auth requests. Please retry later.',
    );
    expect(thirdResponse.headers['ratelimit-limit']).toBe('2');
    expect(thirdResponse.headers['ratelimit-remaining']).toBe('0');
    expect(thirdResponse.headers['retry-after']).toEqual(expect.any(String));
  });
});
