export const AUTHENTICATED_USER_REQUEST_KEY = 'authenticatedUser';

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  roles: string[];
}
