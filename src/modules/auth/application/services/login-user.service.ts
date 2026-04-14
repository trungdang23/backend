import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  PASSWORD_HASHER,
  type PasswordHasherPort,
} from '../../../users/application/ports/password-hasher.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../../users/application/ports/user-repository.port';
import { toUserProfile } from '../../../users/application/user-profile';
import type { AuthSession } from '../auth-session';
import { buildAuthenticatedUser } from '../build-authenticated-user';
import {
  AUTH_TOKEN_SERVICE,
  type AuthTokenService,
} from '../ports/auth-token-service.port';

export interface LoginUserInput {
  email: string;
  password: string;
}

@Injectable()
export class LoginUserService implements UseCase<LoginUserInput, AuthSession> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(AUTH_TOKEN_SERVICE)
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthSession> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (user === null) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await this.passwordHasher.verify(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const profile = toUserProfile(user);
    const tokens = await this.authTokenService.issueTokens(
      buildAuthenticatedUser(profile),
    );

    return {
      user: profile,
      tokens,
    };
  }
}
