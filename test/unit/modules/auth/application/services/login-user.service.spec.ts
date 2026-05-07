import { LoginUserService } from '../../../../../../src/modules/auth/application/services/login-user.service';
import type { AuthTokenService } from '../../../../../../src/modules/auth/application/ports/auth-token-service.port';
import type { PasswordHasherPort } from '../../../../../../src/modules/users/application/ports/password-hasher.port';
import type { UserRepositoryPort } from '../../../../../../src/modules/users/application/ports/user-repository.port';
import type { User } from '../../../../../../src/modules/users/application/user';
import { InMemoryUserRepository } from '../../../../../support/in-memory-user-repository';

class FakePasswordHasher implements PasswordHasherPort {
  hash(password: string): Promise<string> {
    return Promise.resolve(`hashed:${password}`);
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return Promise.resolve(passwordHash === `hashed:${password}`);
  }
}

describe('LoginUserService', () => {
  function seedUser(repository: InMemoryUserRepository): User {
    const user: User = {
      id: 'user-01',
      email: 'traveler@example.com',
      passwordHash: 'hashed:password123',
      displayName: 'Traveler',
      createdAt: new Date('2026-04-14T10:00:00.000Z'),
      updatedAt: new Date('2026-04-14T10:00:00.000Z'),
    };

    repository.seed(user);

    return user;
  }

  it('authenticates a user with normalized email and returns tokens', async () => {
    const repository = new InMemoryUserRepository();
    const user = seedUser(repository);
    const issueTokens = jest.fn().mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'access-token',
      accessTokenExpiresIn: 900,
      refreshToken: 'refresh-token',
      refreshTokenExpiresIn: 604800,
    });
    const service = new LoginUserService(
      repository as UserRepositoryPort,
      new FakePasswordHasher(),
      {
        issueTokens,
      } as unknown as AuthTokenService,
    );

    const result = await service.execute({
      email: 'Traveler@Example.com',
      password: 'password123',
    });

    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    expect(result.tokens.accessToken).toBe('access-token');
    expect(issueTokens).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      roles: ['traveler'],
    });
  });

  it('rejects unknown email', async () => {
    const service = new LoginUserService(
      new InMemoryUserRepository() as UserRepositoryPort,
      new FakePasswordHasher(),
      {
        issueTokens: jest.fn(),
      } as unknown as AuthTokenService,
    );

    await expect(
      service.execute({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      },
    });
  });

  it('rejects invalid password', async () => {
    const repository = new InMemoryUserRepository();

    seedUser(repository);

    const service = new LoginUserService(
      repository as UserRepositoryPort,
      new FakePasswordHasher(),
      {
        issueTokens: jest.fn(),
      } as unknown as AuthTokenService,
    );

    await expect(
      service.execute({
        email: 'traveler@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      },
    });
  });
});
