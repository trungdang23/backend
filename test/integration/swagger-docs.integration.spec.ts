import { Buffer } from 'node:buffer';

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app/app.module';
import { setupApp } from '../../src/app/bootstrap/setup-app';
import { USER_REPOSITORY } from '../../src/modules/users/application/ports/user-repository.port';
import { InMemoryUserRepository } from '../support/in-memory-user-repository';

type SwaggerSchemaProperty = {
  $ref?: string;
  example?: boolean;
  items?: {
    $ref?: string;
  };
  type?: string;
};

type SwaggerOperationResponse = {
  content: {
    'application/json': {
      schema: {
        properties: Record<string, SwaggerSchemaProperty>;
      };
    };
  };
};

type SwaggerRequestBody = {
  content?: Record<
    string,
    {
      schema?: {
        $ref?: string;
      };
    }
  >;
};

type SwaggerParameter = {
  name: string;
  schema?: {
    enum?: string[];
  };
};

type SwaggerOperation = {
  security?: Array<Record<string, string[]>>;
  requestBody?: SwaggerRequestBody;
  parameters?: SwaggerParameter[];
  responses: Record<string, SwaggerOperationResponse>;
};

type SwaggerDocument = {
  components: {
    schemas: Record<string, unknown>;
  };
  openapi: string;
  paths: Record<string, Record<string, SwaggerOperation>>;
};

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
      const authorizedDocsJsonBody =
        authorizedDocsJsonResponse.body as SwaggerDocument;
      const registerOperation =
        authorizedDocsJsonBody.paths['/api/v1/auth/register'].post;
      const currentUserOperation =
        authorizedDocsJsonBody.paths['/api/v1/auth/me'].get;
      const ownedTripsListOperation =
        authorizedDocsJsonBody.paths['/api/v1/trips'].get;
      const ownedPlannerOperation =
        authorizedDocsJsonBody.paths['/api/v1/trips/{tripId}/planner'].get;
      const ownedBudgetOperation =
        authorizedDocsJsonBody.paths['/api/v1/trips/{tripId}/budget-summary']
          .get;
      const ownedJournalListOperation =
        authorizedDocsJsonBody.paths['/api/v1/journals/mine'].get;
      const ownedJournalGetOperation =
        authorizedDocsJsonBody.paths['/api/v1/trips/{tripId}/journal'].get;
      const ownedJournalSaveOperation =
        authorizedDocsJsonBody.paths['/api/v1/trips/{tripId}/journal'].put;
      const ownedJournalVisibilityOperation =
        authorizedDocsJsonBody.paths['/api/v1/trips/{tripId}/journal'].patch;
      const journalAssetUploadOperation =
        authorizedDocsJsonBody.paths['/api/v1/trips/{tripId}/journal/assets']
          .post;
      const journalAssetListOperation =
        authorizedDocsJsonBody.paths['/api/v1/trips/{tripId}/journal/assets']
          .get;
      const publicTripsListOperation =
        authorizedDocsJsonBody.paths['/api/v1/public/trips'].get;
      const publicTripDetailOperation =
        authorizedDocsJsonBody.paths['/api/v1/public/trips/{tripId}'].get;
      const publicJournalListOperation =
        authorizedDocsJsonBody.paths['/api/v1/public/journals'].get;
      const publicJournalDetailOperation =
        authorizedDocsJsonBody.paths['/api/v1/public/trips/{tripId}/journal']
          .get;
      const journalAssetReadOperation =
        authorizedDocsJsonBody.paths['/api/v1/journal-assets/{publicId}'].get;
      const createPostOperation =
        authorizedDocsJsonBody.paths['/api/v1/posts'].post;

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
      expect(registerOperation.security).toBeUndefined();
      expect(registerOperation.requestBody).toBeDefined();
      expect(registerOperation.responses).toHaveProperty('201');
      expect(
        registerOperation.responses['201'].content['application/json'].schema
          .properties.success.example,
      ).toBe(true);
      expect(
        registerOperation.responses['201'].content['application/json'].schema
          .properties.data.$ref,
      ).toContain('AuthSessionResponseDto');
      expect(currentUserOperation.security).toEqual([{ bearer: [] }]);
      expect(publicTripsListOperation.security).toBeUndefined();
      expect(publicTripDetailOperation.security).toBeUndefined();
      expect(publicJournalListOperation.security).toBeUndefined();
      expect(publicJournalDetailOperation.security).toBeUndefined();
      const sortParameter = ownedTripsListOperation.parameters?.find(
        (parameter) => parameter.name === 'sort',
      );

      expect(ownedTripsListOperation.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'page',
          }),
          expect.objectContaining({
            name: 'size',
          }),
          expect.objectContaining({
            name: 'sort',
          }),
        ]),
      );
      expect(sortParameter?.schema?.enum).toEqual(
        expect.arrayContaining([
          'startDate,asc',
          'startDate,desc',
          'name,asc',
          'name,desc',
        ]),
      );
      expect(
        ownedTripsListOperation.responses['200'].content['application/json']
          .schema.properties.meta.$ref,
      ).toContain('PaginatedCollectionMetaDto');
      expect(
        ownedPlannerOperation.responses['200'].content['application/json']
          .schema.properties.data.$ref,
      ).toContain('TripPlannerResponseDto');
      expect(
        ownedBudgetOperation.responses['200'].content['application/json'].schema
          .properties.data.$ref,
      ).toContain('BudgetSummaryResponseDto');
      expect(ownedJournalListOperation.security).toEqual([{ bearer: [] }]);
      expect(ownedJournalGetOperation.security).toEqual([{ bearer: [] }]);
      expect(ownedJournalSaveOperation.security).toEqual([{ bearer: [] }]);
      expect(ownedJournalVisibilityOperation.security).toEqual([
        { bearer: [] },
      ]);
      expect(ownedJournalSaveOperation.requestBody).toBeDefined();
      expect(
        ownedJournalSaveOperation.requestBody?.content?.[
          'application/json'
        ]?.schema?.$ref,
      ).toContain('SaveTripJournalRequestDto');
      expect(
        ownedJournalListOperation.responses['200'].content['application/json']
          .schema.properties.data.type,
      ).toBe('array');
      expect(
        ownedJournalListOperation.responses['200'].content['application/json']
          .schema.properties.data.items?.$ref,
      ).toContain('TripJournalResponseDto');
      expect(
        ownedJournalGetOperation.responses['200'].content['application/json']
          .schema.properties.data.$ref,
      ).toContain('TripJournalResponseDto');
      expect(
        journalAssetUploadOperation.requestBody?.content?.[
          'multipart/form-data'
        ]?.schema?.$ref,
      ).toContain('UploadTripJournalAssetRequestDto');
      expect(
        journalAssetUploadOperation.responses['201'].content[
          'application/json'
        ].schema.properties.data.$ref,
      ).toContain('TripJournalAssetUploadResponseDto');
      expect(
        journalAssetListOperation.responses['200'].content['application/json']
          .schema.properties.data.$ref,
      ).toContain('TripJournalAssetListResponseDto');
      expect(
        publicJournalListOperation.responses['200'].content['application/json']
          .schema.properties.data.type,
      ).toBe('array');
      expect(
        publicJournalListOperation.responses['200'].content['application/json']
          .schema.properties.data.items?.$ref,
      ).toContain('TripJournalResponseDto');
      expect(
        publicJournalDetailOperation.responses['200'].content[
          'application/json'
        ].schema.properties.data.$ref,
      ).toContain('TripJournalResponseDto');
      expect(journalAssetReadOperation.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'expiresAt',
          }),
          expect.objectContaining({
            name: 'signature',
          }),
        ]),
      );
      expect(createPostOperation.responses).toHaveProperty('201');
      expect(
        createPostOperation.responses['201'].content['application/json']
          .schema.properties.data.$ref,
      ).toContain('PostResponseDto');
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
