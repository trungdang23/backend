import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';
import request from 'supertest';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { USER_AVATAR_STORAGE } from '../../../src/modules/users/application/ports/user-avatar-storage.port';
import { PASSWORD_HASHER } from '../../../src/modules/users/application/ports/password-hasher.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import type { PasswordHasherPort } from '../../../src/modules/users/application/ports/password-hasher.port';
import { dispatchRequest } from '../../support/dispatch-request';
import { InMemoryUserAvatarStorage } from '../../support/in-memory-user-avatar-storage';
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
  let httpServer: Parameters<typeof request>[0];
  let userAvatarStorage: InMemoryUserAvatarStorage;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .overrideProvider(USER_AVATAR_STORAGE)
      .useClass(InMemoryUserAvatarStorage)
      .overrideProvider(PASSWORD_HASHER)
      .useClass(FakePasswordHasher)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();
    expressApp = app.getHttpAdapter().getInstance() as Express;
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    userAvatarStorage = app.get<InMemoryUserAvatarStorage>(USER_AVATAR_STORAGE);
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
          avatarUrl: string | null;
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
    expect(body.data.user.avatarUrl).toBeNull();
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
    expect(body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
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

  it('updates the current user display name', async () => {
    const sessionResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'profile-update@example.com',
        password: 'password123',
        displayName: 'Before Update',
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
      method: 'PATCH',
      path: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${sessionBody.data.tokens.accessToken}`,
      },
      body: {
        displayName: 'After Update',
      },
    });
    const body = response.body as {
      success: boolean;
      data: {
        user: {
          displayName: string | null;
          avatarUrl: string | null;
        };
      };
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.displayName).toBe('After Update');
    expect(body.data.user.avatarUrl).toBeNull();
  });

  it('uploads, serves, replaces, and deletes the current user avatar', async () => {
    userAvatarStorage.clear();

    const sessionResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'avatar-owner@example.com',
        password: 'password123',
        displayName: 'Avatar Owner',
      },
    });
    const sessionBody = sessionResponse.body as {
      data: {
        tokens: {
          accessToken: string;
        };
      };
    };
    const firstAvatarBuffer = Buffer.from('fake-png-avatar');

    const firstUploadResponse = await request(httpServer)
      .post('/api/v1/auth/me/avatar')
      .set('Authorization', `Bearer ${sessionBody.data.tokens.accessToken}`)
      .attach('file', firstAvatarBuffer, {
        contentType: 'image/png',
        filename: 'avatar-one.png',
      });
    const firstUploadBody = firstUploadResponse.body as {
      success: boolean;
      data: {
        user: {
          avatarUrl: string | null;
        };
      };
    };

    expect(firstUploadResponse.statusCode).toBe(201);
    expect(firstUploadBody.success).toBe(true);
    expect(firstUploadBody.data.user.avatarUrl).toMatch(/^\/user-avatars\/.+$/);

    const firstAvatarUrl = firstUploadBody.data.user.avatarUrl as string;
    const firstPublicId = firstAvatarUrl.split('/').pop() as string;
    const firstStorageKey = `${firstPublicId}.avatar`;

    expect(userAvatarStorage.has(firstStorageKey)).toBe(true);

    const readResponse = await request(httpServer).get(
      `/api/v1${firstAvatarUrl}`,
    );

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.headers['content-type']).toContain('image/png');
    expect(readResponse.body).toEqual(firstAvatarBuffer);

    const secondUploadResponse = await request(httpServer)
      .post('/api/v1/auth/me/avatar')
      .set('Authorization', `Bearer ${sessionBody.data.tokens.accessToken}`)
      .attach('file', Buffer.from('fake-jpeg-avatar'), {
        contentType: 'image/jpeg',
        filename: 'avatar-two.jpg',
      });
    const secondUploadBody = secondUploadResponse.body as {
      data: {
        user: {
          avatarUrl: string | null;
        };
      };
    };

    expect(secondUploadResponse.statusCode).toBe(201);
    expect(secondUploadBody.data.user.avatarUrl).toMatch(
      /^\/user-avatars\/.+$/,
    );
    expect(secondUploadBody.data.user.avatarUrl).not.toBe(firstAvatarUrl);
    expect(userAvatarStorage.has(firstStorageKey)).toBe(false);

    const deleteResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: '/api/v1/auth/me/avatar',
      headers: {
        authorization: `Bearer ${sessionBody.data.tokens.accessToken}`,
      },
    });
    const deleteBody = deleteResponse.body as {
      success: boolean;
      data: {
        user: {
          avatarUrl: string | null;
        };
      };
    };

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteBody.success).toBe(true);
    expect(deleteBody.data.user.avatarUrl).toBeNull();
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

    const reusedRefreshResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/refresh',
      body: {
        refreshToken: sessionBody.data.tokens.refreshToken,
      },
    });
    const reusedRefreshBody = reusedRefreshResponse.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(reusedRefreshResponse.statusCode).toBe(401);
    expect(reusedRefreshBody.success).toBe(false);
    expect(reusedRefreshBody.error.code).toBe('UNAUTHORIZED');
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

    const refreshAfterLogoutResponse = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/refresh',
      body: {
        refreshToken: sessionBody.data.tokens.refreshToken,
      },
    });
    const refreshAfterLogoutBody = refreshAfterLogoutResponse.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(refreshAfterLogoutResponse.statusCode).toBe(401);
    expect(refreshAfterLogoutBody.success).toBe(false);
    expect(refreshAfterLogoutBody.error.code).toBe('UNAUTHORIZED');
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
