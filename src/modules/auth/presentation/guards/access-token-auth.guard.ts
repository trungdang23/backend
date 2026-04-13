import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RequestContextService } from '../../../../app/request-context/request-context.service';
import { AUTHENTICATED_USER_REQUEST_KEY } from '../../application/authenticated-user';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
} from '../../application/ports/access-token-verifier.port';
import type { AuthenticatedRequest } from '../authenticated-request';
import { IS_PUBLIC_ROUTE_KEY } from '../decorators/public.decorator';

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(
    @Inject(ACCESS_TOKEN_VERIFIER)
    private readonly accessTokenVerifier: AccessTokenVerifier,
    private readonly reflector: Reflector,
    private readonly requestContextService: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublicRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.extractBearerToken(request.headers.authorization);

    if (accessToken === undefined) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const authenticatedUser =
      await this.accessTokenVerifier.verifyAccessToken(accessToken);

    request[AUTHENTICATED_USER_REQUEST_KEY] = authenticatedUser;
    this.requestContextService.assign({
      actorId: authenticatedUser.userId,
    });

    return true;
  }

  private extractBearerToken(
    authorizationHeader: string | string[] | undefined,
  ): string | undefined {
    const normalizedHeader = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    if (normalizedHeader === undefined) {
      return undefined;
    }

    const [scheme, token, ...rest] = normalizedHeader.trim().split(/\s+/);

    if (
      scheme.toLowerCase() !== 'bearer' ||
      token.length === 0 ||
      rest.length > 0
    ) {
      return undefined;
    }

    return token;
  }
}
