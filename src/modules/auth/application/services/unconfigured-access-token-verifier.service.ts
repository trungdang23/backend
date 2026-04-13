import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { AuthenticatedUser } from '../authenticated-user';
import type { AccessTokenVerifier } from '../ports/access-token-verifier.port';

@Injectable()
export class UnconfiguredAccessTokenVerifier implements AccessTokenVerifier {
  verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    void accessToken;

    return Promise.reject(
      new UnauthorizedException(
        'Access token verification is not configured yet.',
      ),
    );
  }
}
