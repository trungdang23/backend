import type { User } from '../user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: {
    email: string;
    passwordHash: string;
    displayName?: string | null;
  }): Promise<User>;
}
