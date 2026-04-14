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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);

    return Promise.resolve(user);
  }

  seed(user: User): void {
    this.users.set(user.id, user);
  }
}
