import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { PASSWORD_HASHER } from '../../../src/modules/users/application/ports/password-hasher.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import type { PasswordHasherPort } from '../../../src/modules/users/application/ports/password-hasher.port';
import type { UserRepositoryPort } from '../../../src/modules/users/application/ports/user-repository.port';
import type { User } from '../../../src/modules/users/application/user';
import { dispatchRequest } from '../../support/dispatch-request';

class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async create(input: {
    email: string;
    passwordHash: string;
    displayName?: string | null;
  }): Promise<User> {
    const user: User = {
      id: `user-${this.users.size + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }
}

class FakePasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hashed:${password}`;
  }
}

describe('Auth register integration', () => {
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

  it('registers a user and returns the shared success envelope', async () => {
    const response = await dispatchRequest(expressApp, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        email: 'Demo@Example.com',
        password: 'password123',
        displayName: 'Demo User',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: {
        user: {
          id: expect.any(String),
          email: 'demo@example.com',
          displayName: 'Demo User',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
  });

  it('rejects duplicate email', async () => {
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
});
