import { ConflictException } from '@nestjs/common';

import { RegisterUserService } from '../../../../../../src/modules/users/application/services/register-user.service';
import type { PasswordHasherPort } from '../../../../../../src/modules/users/application/ports/password-hasher.port';
import type { UserRepositoryPort } from '../../../../../../src/modules/users/application/ports/user-repository.port';
import type { User } from '../../../../../../src/modules/users/application/user';

class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      Array.from(this.users.values()).find((user) => user.email === email) ??
        null,
    );
  }

  async findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  async findByAvatarPublicId(publicId: string): Promise<User | null> {
    return Promise.resolve(
      Array.from(this.users.values()).find(
        (user) => user.avatarPublicId === publicId,
      ) ?? null,
    );
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
      avatarFileName: null,
      avatarContentType: null,
      avatarByteSize: null,
      avatarStorageKey: null,
      avatarPublicId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }

  updateProfile(input: {
    userId: string;
    displayName: string | null;
  }): Promise<User | null> {
    const user = this.users.get(input.userId);

    if (user === undefined) {
      return Promise.resolve(null);
    }

    const updatedUser = {
      ...user,
      displayName: input.displayName,
      updatedAt: new Date(),
    };

    this.users.set(updatedUser.id, updatedUser);

    return Promise.resolve(updatedUser);
  }

  updateAvatar(input: {
    userId: string;
    fileName: string;
    contentType: string;
    byteSize: number;
    storageKey: string;
    publicId: string;
  }): Promise<{ user: User; previousStorageKey: string | null } | null> {
    const user = this.users.get(input.userId);

    if (user === undefined) {
      return Promise.resolve(null);
    }

    const updatedUser = {
      ...user,
      avatarFileName: input.fileName,
      avatarContentType: input.contentType,
      avatarByteSize: input.byteSize,
      avatarStorageKey: input.storageKey,
      avatarPublicId: input.publicId,
      updatedAt: new Date(),
    };

    this.users.set(updatedUser.id, updatedUser);

    return Promise.resolve({
      user: updatedUser,
      previousStorageKey: user.avatarStorageKey ?? null,
    });
  }

  clearAvatar(input: {
    userId: string;
  }): Promise<{ user: User; previousStorageKey: string | null } | null> {
    const user = this.users.get(input.userId);

    if (user === undefined) {
      return Promise.resolve(null);
    }

    const updatedUser = {
      ...user,
      avatarFileName: null,
      avatarContentType: null,
      avatarByteSize: null,
      avatarStorageKey: null,
      avatarPublicId: null,
      updatedAt: new Date(),
    };

    this.users.set(updatedUser.id, updatedUser);

    return Promise.resolve({
      user: updatedUser,
      previousStorageKey: user.avatarStorageKey ?? null,
    });
  }
}

class FakePasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    return Promise.resolve(`hashed:${password}`);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return Promise.resolve(passwordHash === `hashed:${password}`);
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
