import { NotFoundException } from '@nestjs/common';

import { GetUserProfileService } from '../../../../../../src/modules/users/application/services/get-user-profile.service';
import type { UserRepositoryPort } from '../../../../../../src/modules/users/application/ports/user-repository.port';
import type { User } from '../../../../../../src/modules/users/application/user';
import { InMemoryUserRepository } from '../../../../../support/in-memory-user-repository';

describe('GetUserProfileService', () => {
  it('returns a public user profile', async () => {
    const repository = new InMemoryUserRepository();
    const user: User = {
      id: 'user-01',
      email: 'traveler@example.com',
      passwordHash: 'hashed:password123',
      displayName: 'Traveler',
      createdAt: new Date('2026-04-14T10:00:00.000Z'),
      updatedAt: new Date('2026-04-14T10:00:00.000Z'),
    };

    repository.seed(user);

    const service = new GetUserProfileService(repository as UserRepositoryPort);

    await expect(service.execute({ userId: user.id })).resolves.toEqual({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  it('rejects missing users', async () => {
    const service = new GetUserProfileService(
      new InMemoryUserRepository() as UserRepositoryPort,
    );

    await expect(
      service.execute({
        userId: 'missing-user',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
