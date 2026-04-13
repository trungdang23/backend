import {
  UnauthorizedException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';

import { AUTHENTICATED_USER_REQUEST_KEY } from '../../application/authenticated-user';
import type { AuthenticatedRequest } from '../authenticated-request';

export const CurrentUser = createParamDecorator(
  (_data: undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authenticatedUser = request[AUTHENTICATED_USER_REQUEST_KEY];

    if (authenticatedUser === undefined) {
      throw new UnauthorizedException(
        'Authenticated user is not available on the request.',
      );
    }

    return authenticatedUser;
  },
);
