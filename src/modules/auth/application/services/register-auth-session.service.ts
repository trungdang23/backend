import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import type { RegisterUserInput } from '../../../users/application/services/register-user.service';
import { RegisterUserService } from '../../../users/application/services/register-user.service';
import type { AuthSession } from '../auth-session';
import { buildAuthenticatedUser } from '../build-authenticated-user';
import {
  AUTH_TOKEN_SERVICE,
  type AuthTokenService,
} from '../ports/auth-token-service.port';

@Injectable()
export class RegisterAuthSessionService implements UseCase<
  RegisterUserInput,
  AuthSession
> {
  constructor(
    private readonly registerUser: RegisterUserService,
    @Inject(AUTH_TOKEN_SERVICE)
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthSession> {
    const user = await this.registerUser.execute(input);
    const tokens = await this.authTokenService.issueTokens(
      buildAuthenticatedUser(user),
    );

    return {
      user,
      tokens,
    };
  }
}
