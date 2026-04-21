import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../../users/application/ports/user-repository.port';
import { toUserProfile } from '../../../users/application/user-profile';
import type { AuthTokens } from '../auth-tokens';
import { buildAuthenticatedUser } from '../build-authenticated-user';
import {
  AUTH_TOKEN_SERVICE,
  type AuthTokenService,
} from '../ports/auth-token-service.port';

export interface RefreshAuthSessionInput {
  refreshToken: string;
}

@Injectable()
export class RefreshAuthSessionService implements UseCase<
  RefreshAuthSessionInput,
  AuthTokens
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(AUTH_TOKEN_SERVICE)
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(input: RefreshAuthSessionInput): Promise<AuthTokens> {
    const refreshTokenSubject = await this.authTokenService.revokeRefreshToken(
      input.refreshToken,
    );
    const user = await this.userRepository.findById(refreshTokenSubject.userId);

    if (user === null) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    return this.authTokenService.issueTokens(
      buildAuthenticatedUser(toUserProfile(user)),
    );
  }
}
