import type { AuthenticatedUser } from '../authenticated-user';
import type { AuthTokens } from '../auth-tokens';

export const AUTH_TOKEN_SERVICE = Symbol('AUTH_TOKEN_SERVICE');

export interface RefreshTokenSubject {
  userId: string;
  tokenId: string;
  expiresAt: Date;
}

export interface AuthTokenService {
  issueTokens(subject: AuthenticatedUser): Promise<AuthTokens>;
  verifyAccessToken(accessToken: string): Promise<AuthenticatedUser>;
  verifyRefreshToken(refreshToken: string): Promise<RefreshTokenSubject>;
  revokeRefreshToken(refreshToken: string): Promise<RefreshTokenSubject>;
}
