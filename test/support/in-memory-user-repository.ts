import type { UserRepositoryPort } from '../../src/modules/users/application/ports/user-repository.port';
import type { User } from '../../src/modules/users/application/user';

export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      Array.from(this.users.values()).find((user) => user.email === email) ??
        null,
    );
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByAvatarPublicId(publicId: string): Promise<User | null> {
    return Promise.resolve(
      Array.from(this.users.values()).find(
        (user) => user.avatarPublicId === publicId,
      ) ?? null,
    );
  }

  create(input: {
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

    const updatedUser: User = {
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

    const updatedUser: User = {
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

    const updatedUser: User = {
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

  seed(user: User): void {
    this.users.set(user.id, user);
  }

  clear(): void {
    this.users.clear();
  }
}
