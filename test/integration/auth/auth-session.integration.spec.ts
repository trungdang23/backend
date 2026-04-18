import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { PASSWORD_HASHER } from '../../../src/modules/users/application/ports/password-hasher.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import type { PasswordHasherPort } from '../../../src/modules/users/application/ports/password-hasher.port';
import { dispatchRequest } from '../../support/dispatch-request';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

class FakePasswordHasher implements PasswordHasherPort {
  hash(password: string): Promise<string> {
    return Promise.resolve(`hashed:${password}`);
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return Promise.resolve(passwordHash === `hashed:${password}`);
  }
}

describe('Auth session integration', () => {
  let app: INestApplication;
  let expressApp: Express;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(FakePasswordHasher)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();
    expressApp = app.getHttpAdapter().getInstance() as Express;
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user and returns an authenticated session', async () => {
    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'Demo@Example.com',
        password: 'password123',
        displayName: 'Demo User',
      },
    });
    const body = response.body as {
      success: boolean;
      data: {
        user: {
          id: string;
          email: string;
          displayName: string | null;
          createdAt: string;
          updatedAt: string;
        };
        tokens: {
          tokenType: string;
          accessToken: string;
          accessTokenExpiresIn: number;
          refreshToken: string;
          refreshTokenExpiresIn: number;
        };
      };
    };

    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.id).toEqual(expect.any(String));
    expect(body.data.user.email).toBe('demo@example.com');
    expect(body.data.user.displayName).toBe('Demo User');
    expect(body.data.user.createdAt).toEqual(expect.any(String));
    expect(body.data.user.updatedAt).toEqual(expect.any(String));
    expect(body.data.tokens.tokenType).toBe('Bearer');
    expect(body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(body.data.tokens.accessTokenExpiresIn).toBe(900);
    expect(body.data.tokens.refreshToken).toEqual(expect.any(String));
    expect(body.data.tokens.refreshTokenExpiresIn).toBe(604800);
  });

  it('rejects duplicate email registration', async () => {
    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'duplicate@example.com',
        password: 'password123',
      },
    });

    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'duplicate@example.com',
        password: 'password123',
      },
    });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(response.statusCode).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('HTTP_ERROR');
  });

  it('logs a user in and returns a new authenticated session', async () => {
    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'login@example.com',
        password: 'password123',
        displayName: 'Login User',
      },
    });

    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: {
        email: 'LOGIN@example.com',
        password: 'password123',
      },
    });
    const body = response.body as {
      success: boolean;
      data: {
        user: {
          email: string;
        };
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      };
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('login@example.com');
    expect(body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(body.data.tokens.refreshToken).toEqual(expect.any(String));
  });

  it('rejects invalid credentials', async () => {
    await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'wrong-password@example.com',
        password: 'password123',
      },
    });

    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: {
        email: 'wrong-password@example.com',
        password: 'bad-password',
      },
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
    expect(body.error.message).toBe('Invalid email or password.');
  });

  it('returns the current user for a valid access token', async () => {
    const sessionResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'me@example.com',
        password: 'password123',
        displayName: 'Current User',
      },
    });
    const sessionBody = sessionResponse.body as {
      data: {
        tokens: {
          accessToken: string;
        };
      };
    };

    const response = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${sessionBody.data.tokens.accessToken}`,
      },
    });
    const body = response.body as {
      success: boolean;
      data: {
        user: {
          email: string;
          displayName: string | null;
        };
      };
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('me@example.com');
    expect(body.data.user.displayName).toBe('Current User');
  });

  it('rotates tokens from a valid refresh token', async () => {
    const sessionResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'refresh@example.com',
        password: 'password123',
      },
    });
    const sessionBody = sessionResponse.body as {
      data: {
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      };
    };

    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/refresh',
      body: {
        refreshToken: sessionBody.data.tokens.refreshToken,
      },
    });
    const body = response.body as {
      success: boolean;
      data: {
        tokens: {
          accessToken: string;
          refreshToken: string;
        };
      };
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(body.data.tokens.refreshToken).toEqual(expect.any(String));
    expect(body.data.tokens.accessToken).not.toBe(
      sessionBody.data.tokens.accessToken,
    );
    expect(body.data.tokens.refreshToken).not.toBe(
      sessionBody.data.tokens.refreshToken,
    );
  });

  it('logs a user out with a valid refresh token', async () => {
    const sessionResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'logout@example.com',
        password: 'password123',
      },
    });
    const sessionBody = sessionResponse.body as {
      data: {
        tokens: {
          refreshToken: string;
        };
      };
    };

    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/logout',
      body: {
        refreshToken: sessionBody.data.tokens.refreshToken,
      },
    });
    const body = response.body as {
      success: boolean;
      data: {
        loggedOut: boolean;
      };
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.loggedOut).toBe(true);
  });

  it('rejects malformed logout requests', async () => {
    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/logout',
      body: {
        refreshToken: 'short-token',
      },
    });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(response.statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
  });
});
