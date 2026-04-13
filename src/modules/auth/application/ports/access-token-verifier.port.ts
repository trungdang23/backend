import type { AuthenticatedUser } from '../authenticated-user';

export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');

export interface AccessTokenVerifier {
  verifyAccessToken(accessToken: string): Promise<AuthenticatedUser>;
}
