import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { RequestContextService } from '../../../../../../src/app/request-context/request-context.service';
import { type AccessTokenVerifier } from '../../../../../../src/modules/auth/application/ports/access-token-verifier.port';
import { AccessTokenAuthGuard } from '../../../../../../src/modules/auth/presentation/guards/access-token-auth.guard';

describe('AccessTokenAuthGuard', () => {
  function createExecutionContext(
    authorizationHeader?: string,
  ): ExecutionContext {
    return {
      getClass: jest.fn(),
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authorizationHeader,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('returns true for public routes', async () => {
    const verifyAccessToken = jest.fn();
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    const accessTokenVerifier = {
      verifyAccessToken,
    } as unknown as AccessTokenVerifier;
    const guard = new AccessTokenAuthGuard(
      accessTokenVerifier,
      reflector,
      new RequestContextService(),
    );

    await expect(guard.canActivate(createExecutionContext())).resolves.toBe(
      true,
    );
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects requests without a bearer token', async () => {
    const guard = new AccessTokenAuthGuard(
      {
        verifyAccessToken: jest.fn(),
      } as unknown as AccessTokenVerifier,
      {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector,
      new RequestContextService(),
    );

    await expect(guard.canActivate(createExecutionContext())).rejects.toThrow(
      new UnauthorizedException('Missing bearer token.'),
    );
  });

  it('attaches the authenticated user and enriches the request context', async () => {
    const requestContextService = new RequestContextService();
    const verifyAccessToken = jest.fn().mockResolvedValue({
      roles: ['traveler'],
      userId: 'user-01',
    });
    const accessTokenVerifier = {
      verifyAccessToken,
    } as unknown as AccessTokenVerifier;
    const guard = new AccessTokenAuthGuard(
      accessTokenVerifier,
      {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector,
      requestContextService,
    );
    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    const executionContext = {
      getClass: jest.fn(),
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await requestContextService.run(
      {
        correlationId: 'journey-correlation-id',
      },
      async () => {
        await expect(guard.canActivate(executionContext)).resolves.toBe(true);
        expect(request).toEqual({
          authenticatedUser: {
            roles: ['traveler'],
            userId: 'user-01',
          },
          headers: {
            authorization: 'Bearer valid-token',
          },
        });
        expect(requestContextService.getContext()).toEqual({
          actorId: 'user-01',
          correlationId: 'journey-correlation-id',
        });
      },
    );

    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
  });
});
