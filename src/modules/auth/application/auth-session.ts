import type { UserProfile } from '../../users/application/user-profile';
import type { AuthTokens } from './auth-tokens';

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
}
