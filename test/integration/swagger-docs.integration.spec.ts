import { Buffer } from 'node:buffer';

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app/app.module';
import { setupApp } from '../../src/app/bootstrap/setup-app';
import { USER_REPOSITORY } from '../../src/modules/users/application/ports/user-repository.port';
import { InMemoryUserRepository } from '../support/in-memory-user-repository';

describe('Swagger docs integration', () => {
  jest.setTimeout(30000);

  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  async function createSwaggerDocsApp(envOverrides: Record<string, string>) {
    process.env = {
      ...originalEnv,
      ...envOverrides,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .compile();

    const app = moduleFixture.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();

    return app;
  }

  it('protects swagger docs with basic auth when credentials are configured', async () => {
    const app = await createSwaggerDocsApp({
      NODE_ENV: 'production',
      SWAGGER_ENABLED: 'true',
      SWAGGER_PASSWORD: 'docs-password',
      SWAGGER_USERNAME: 'docs-user',
    });
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const authorizationHeader = `Basic ${Buffer.from('docs-user:docs-password').toString('base64')}`;

    try {
      const unauthorizedDocsResponse =
        await request(httpServer).get('/api/v1/docs');
      const authorizedDocsResponse = await request(httpServer)
        .get('/api/v1/docs')
        .set('Authorization', authorizationHeader);
      const authorizedDocsJsonResponse = await request(httpServer)
        .get('/api/v1/docs-json')
        .set('Authorization', authorizationHeader);
      const authorizedDocsJsonBody = authorizedDocsJsonResponse.body as {
        openapi: string;
        paths: Record<string, unknown>;
      };

      expect(unauthorizedDocsResponse.statusCode).toBe(401);
      expect(unauthorizedDocsResponse.headers['www-authenticate']).toContain(
        'Basic',
      );
      expect(authorizedDocsResponse.statusCode).toBe(200);
      expect(authorizedDocsResponse.text).toContain('Swagger UI');
      expect(authorizedDocsJsonResponse.statusCode).toBe(200);
      expect(authorizedDocsJsonBody.openapi).toBe('3.0.0');
      expect(authorizedDocsJsonBody.paths).not.toHaveProperty(
        '/api/v1/trips/{tripId}/itinerary',
      );
      expect(authorizedDocsJsonBody.paths).not.toHaveProperty(
        '/api/v1/trips/{tripId}/itinerary/days',
      );
      expect(authorizedDocsJsonBody.paths).not.toHaveProperty(
        '/api/v1/nodes/{nodeId}/stickers',
      );
    } finally {
      await app.close();
    }
  });

  it('does not mount swagger docs in production when credentials are missing', async () => {
    const app = await createSwaggerDocsApp({
      NODE_ENV: 'production',
      SWAGGER_ENABLED: 'true',
      SWAGGER_PASSWORD: '',
      SWAGGER_USERNAME: '',
    });
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    try {
      const docsResponse = await request(httpServer).get('/api/v1/docs');
      const docsJsonResponse =
        await request(httpServer).get('/api/v1/docs-json');

      expect(docsResponse.statusCode).toBe(404);
      expect(docsJsonResponse.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
