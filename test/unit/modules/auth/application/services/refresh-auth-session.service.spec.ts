import { UnauthorizedException } from '@nestjs/common';

import { RefreshAuthSessionService } from '../../../../../../src/modules/auth/application/services/refresh-auth-session.service';
import type { AuthTokenService } from '../../../../../../src/modules/auth/application/ports/auth-token-service.port';
import type { UserRepositoryPort } from '../../../../../../src/modules/users/application/ports/user-repository.port';
import type { User } from '../../../../../../src/modules/users/application/user';
import { InMemoryUserRepository } from '../../../../../support/in-memory-user-repository';

describe('RefreshAuthSessionService', () => {
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

  it('reissues tokens for a valid refresh token subject', async () => {
    const repository = new InMemoryUserRepository();
    const user = seedUser(repository);
    const revokeRefreshToken = jest.fn().mockResolvedValue({
      userId: user.id,
      tokenId: 'refresh-token-01',
      expiresAt: new Date('2026-04-21T10:00:00.000Z'),
    });
    const issueTokens = jest.fn().mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'next-access-token',
      accessTokenExpiresIn: 900,
      refreshToken: 'next-refresh-token',
      refreshTokenExpiresIn: 604800,
    });
    const service = new RefreshAuthSessionService(
      repository as UserRepositoryPort,
      {
        revokeRefreshToken,
        issueTokens,
      } as unknown as AuthTokenService,
    );

    const result = await service.execute({
      refreshToken: 'valid-refresh-token',
    });

    expect(result.accessToken).toBe('next-access-token');
    expect(revokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(issueTokens).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      roles: ['traveler'],
    });
  });

  it('rejects refresh tokens for deleted users', async () => {
    const service = new RefreshAuthSessionService(
      new InMemoryUserRepository() as UserRepositoryPort,
      {
        revokeRefreshToken: jest.fn().mockResolvedValue({
          userId: 'missing-user',
          tokenId: 'refresh-token-02',
          expiresAt: new Date('2026-04-21T10:00:00.000Z'),
        }),
        issueTokens: jest.fn(),
      } as unknown as AuthTokenService,
    );

    await expect(
      service.execute({
        refreshToken: 'valid-refresh-token',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
