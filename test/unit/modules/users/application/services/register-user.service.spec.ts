import { ConflictException } from '@nestjs/common';

import { RegisterUserService } from '../../../../../../src/modules/users/application/services/register-user.service';
import type { PasswordHasherPort } from '../../../../../../src/modules/users/application/ports/password-hasher.port';
import type { UserRepositoryPort } from '../../../../../../src/modules/users/application/ports/user-repository.port';
import type { User } from '../../../../../../src/modules/users/application/user';

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

describe('RegisterUserService', () => {
  it('registers a new user with normalized email', async () => {
    const repository = new InMemoryUserRepository();
    const hasher = new FakePasswordHasher();
    const service = new RegisterUserService(repository, hasher);

    const result = await service.execute({
      email: 'Test@Example.com',
      password: 'password123',
      displayName: 'Test User',
    });

    expect(result.email).toBe('test@example.com');
    expect(result.displayName).toBe('Test User');
    await expect(
      repository.findByEmail('test@example.com'),
    ).resolves.toBeTruthy();
  });

  it('rejects duplicate email', async () => {
    const repository = new InMemoryUserRepository();
    const hasher = new FakePasswordHasher();
    const service = new RegisterUserService(repository, hasher);

    await service.execute({
      email: 'user@example.com',
      password: 'password123',
    });

    await expect(
      service.execute({
        email: 'user@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
