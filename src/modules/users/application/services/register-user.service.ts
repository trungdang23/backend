import { ConflictException, Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  PASSWORD_HASHER,
  type PasswordHasherPort,
} from '../ports/password-hasher.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';

export interface RegisterUserInput {
  email: string;
  password: string;
  displayName?: string | null;
}

export interface RegisteredUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RegisterUserService
  implements UseCase<RegisterUserInput, RegisteredUser>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisteredUser> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      displayName: input.displayName ?? null,
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
