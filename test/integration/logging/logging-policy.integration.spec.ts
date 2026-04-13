import { BadRequestException, Controller, Get, Module } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { AppConfigService } from '../../../src/app/config/app-config.service';
import { AppLogger } from '../../../src/app/logging/app-logger.service';
import { RequestContextMiddleware } from '../../../src/app/request-context/request-context.middleware';
import { RequestContextService } from '../../../src/app/request-context/request-context.service';
import { dispatchRequest } from '../../support/dispatch-request';

const testAppConfig = {
  globalPrefix: 'api/v1',
  swaggerEnabled: false,
} satisfies Pick<AppConfigService, 'globalPrefix' | 'swaggerEnabled'>;

@Controller('logging')
class LoggingTestController {
  @Get('echo')
  echoRequest() {
    return {
      status: 'ok',
    };
  }

  @Get('fail')
  failRequest() {
    throw new BadRequestException({
      code: 'INVALID_REQUEST',
      errors: {
        accessToken: 'token-123',
        password: 'super-secret',
      },
      message: 'Payload is invalid',
    });
  }
}

@Module({
  controllers: [LoggingTestController],
  providers: [
    AppLogger,
    {
      provide: AppConfigService,
      useValue: testAppConfig,
    },
    RequestContextMiddleware,
    RequestContextService,
  ],
})
class LoggingIntegrationTestModule {}

describe('Logging policy integration', () => {
  let app: INestApplication;
  let expressApp: Express;
  let logger: AppLogger;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LoggingIntegrationTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);

    setupApp(app);
    await app.init();

    expressApp = app.getHttpAdapter().getInstance() as Express;
    logger = app.get(AppLogger);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redacts sensitive request values in request completion logs', async () => {
    const logSpy = jest.spyOn(logger, 'logWithMetadata');

    const response = await dispatchRequest(expressApp, {
      headers: {
        authorization: 'Bearer top-secret-token',
        cookie: 'refreshToken=super-secret-cookie',
      },
      method: 'GET',
      path: '/api/v1/logging/echo?password=super-secret&accessToken=token-123',
    });

    const metadata = logSpy.mock.calls.at(-1)?.[1] as {
      request: {
        headers: {
          authorization: string;
          cookie: string;
        };
        query: {
          accessToken: string;
          password: string;
        };
      };
    };

    expect(response.statusCode).toBe(200);
    expect(metadata.request.headers.authorization).toBe('[REDACTED]');
    expect(metadata.request.headers.cookie).toBe('[REDACTED]');
    expect(metadata.request.query.accessToken).toBe('[REDACTED]');
    expect(metadata.request.query.password).toBe('[REDACTED]');
  });

  it('redacts sensitive error details in exception logs', async () => {
    const errorSpy = jest.spyOn(logger, 'errorWithMetadata');

    const response = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/logging/fail',
    });

    const metadata = errorSpy.mock.calls.at(-1)?.[2] as {
      details: {
        accessToken: string;
        password: string;
      };
    };

    expect(response.statusCode).toBe(400);
    expect(metadata.details.accessToken).toBe('[REDACTED]');
    expect(metadata.details.password).toBe('[REDACTED]');
  });
});
