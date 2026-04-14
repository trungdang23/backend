import type { UserProfile } from '../../users/application/user-profile';
import type { AuthenticatedUser } from './authenticated-user';

const DEFAULT_AUTHENTICATED_USER_ROLES = ['traveler'];

export function buildAuthenticatedUser(user: UserProfile): AuthenticatedUser {
  return {
    userId: user.id,
    email: user.email,
    roles: [...DEFAULT_AUTHENTICATED_USER_ROLES],
  };
}
