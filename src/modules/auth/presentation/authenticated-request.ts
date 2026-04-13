import type { Request } from 'express';
import type { AuthenticatedUser } from '../application/authenticated-user';

export type AuthenticatedRequest = Request & {
  authenticatedUser?: AuthenticatedUser;
};
