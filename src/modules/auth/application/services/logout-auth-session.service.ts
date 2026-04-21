import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  AUTH_TOKEN_SERVICE,
  type AuthTokenService,
} from '../ports/auth-token-service.port';

export interface LogoutAuthSessionInput {
  refreshToken: string;
}

export interface LogoutAuthSessionResult {
  loggedOut: true;
}

@Injectable()
export class LogoutAuthSessionService implements UseCase<
  LogoutAuthSessionInput,
  LogoutAuthSessionResult
> {
  constructor(
    @Inject(AUTH_TOKEN_SERVICE)
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(
    input: LogoutAuthSessionInput,
  ): Promise<LogoutAuthSessionResult> {
    await this.authTokenService.revokeRefreshToken(input.refreshToken);

    return {
      loggedOut: true,
    };
  }
}
