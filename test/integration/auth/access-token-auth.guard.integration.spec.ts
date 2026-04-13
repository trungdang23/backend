import {
  Controller,
  Get,
  Module,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { AppConfigService } from '../../../src/app/config/app-config.service';
import { AppLogger } from '../../../src/app/logging/app-logger.service';
import { RequestContextMiddleware } from '../../../src/app/request-context/request-context.middleware';
import { CORRELATION_ID_HEADER } from '../../../src/app/request-context/request-context';
import { RequestContextService } from '../../../src/app/request-context/request-context.service';
import type { AuthenticatedUser } from '../../../src/modules/auth/application/authenticated-user';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
} from '../../../src/modules/auth/application/ports/access-token-verifier.port';
import { CurrentUser } from '../../../src/modules/auth/presentation/decorators/current-user.decorator';
import { Public } from '../../../src/modules/auth/presentation/decorators/public.decorator';
import { AccessTokenAuthGuard } from '../../../src/modules/auth/presentation/guards/access-token-auth.guard';
import { dispatchRequest } from '../../support/dispatch-request';

const verifyAccessToken = jest.fn<Promise<AuthenticatedUser>, [string]>();
const testAppConfig = {
  globalPrefix: 'api/v1',
  swaggerEnabled: false,
} satisfies Pick<AppConfigService, 'globalPrefix' | 'swaggerEnabled'>;

@Controller('secure')
@UseGuards(AccessTokenAuthGuard)
class SecureTestController {
  @Get('me')
  getCurrentUser(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return {
      roles: authenticatedUser.roles,
      userId: authenticatedUser.userId,
    };
  }

  @Public()
  @Get('ping')
  ping() {
    return {
      status: 'ok',
    };
  }
}

@Module({
  controllers: [SecureTestController],
  providers: [
    AccessTokenAuthGuard,
    AppLogger,
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useValue: {
        verifyAccessToken,
      } satisfies AccessTokenVerifier,
    },
    {
      provide: AppConfigService,
      useValue: testAppConfig,
    },
    RequestContextMiddleware,
    RequestContextService,
  ],
})
class AuthGuardIntegrationTestModule {}

describe('AccessTokenAuthGuard integration', () => {
  let app: INestApplication;
  let expressApp: Express;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthGuardIntegrationTestModule],
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

  beforeEach(() => {
    verifyAccessToken.mockReset();
  });

  it('allows public routes without invoking token verification', async () => {
    const response = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/secure/ping',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
      },
    });
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects protected routes without a bearer token', async () => {
    const response = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/secure/me',
    });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(response.statusCode).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Missing bearer token.');
  });

  it('attaches the authenticated user for protected routes', async () => {
    verifyAccessToken.mockResolvedValue({
      email: 'traveler@example.com',
      roles: ['traveler'],
      userId: 'user-01',
    });

    const response = await dispatchRequest(expressApp, {
      headers: {
        authorization: 'Bearer valid-token',
        [CORRELATION_ID_HEADER]: 'secure-request-correlation-id',
      },
      method: 'GET',
      path: '/api/v1/secure/me',
    });
    const body = response.body as {
      success: boolean;
      data: {
        roles: string[];
        userId: string;
      };
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      roles: ['traveler'],
      userId: 'user-01',
    });
    expect(response.headers[CORRELATION_ID_HEADER]).toBe(
      'secure-request-correlation-id',
    );
    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
  });

  it('propagates verifier failures as unauthorized responses', async () => {
    verifyAccessToken.mockRejectedValue(
      new UnauthorizedException('Access token is invalid.'),
    );

    const response = await dispatchRequest(expressApp, {
      headers: {
        authorization: 'Bearer invalid-token',
      },
      method: 'GET',
      path: '/api/v1/secure/me',
    });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
        message: string;
      };
    };

    expect(response.statusCode).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Access token is invalid.');
  });
});
