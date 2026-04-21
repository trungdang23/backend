import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '../../../../../../src/app/config/app-config';
import { JwtAuthTokenService } from '../../../../../../src/modules/auth/infrastructure/security/jwt-auth-token.service';

describe('JwtAuthTokenService', () => {
  function createConfigService(
    overrides?: Partial<ApplicationConfig['auth']>,
  ): ConfigService<ApplicationConfig, true> {
    const auth = {
      jwtIssuer: 'journey.test',
      accessTokenSecret: 'journey-test-access-token-secret-123456789',
      accessTokenTtl: '15m',
      refreshTokenSecret: 'journey-test-refresh-token-secret-123456789',
      refreshTokenTtl: '7d',
      ...overrides,
    };
    const app = {
      name: 'journey-backend',
      nodeEnv: 'test',
    } as const;

    return {
      get(path: string) {
        switch (path) {
          case 'app.name':
            return app.name;
          case 'app.nodeEnv':
            return app.nodeEnv;
          case 'auth.jwtIssuer':
            return auth.jwtIssuer;
          case 'auth.accessTokenSecret':
            return auth.accessTokenSecret;
          case 'auth.accessTokenTtl':
            return auth.accessTokenTtl;
          case 'auth.refreshTokenSecret':
            return auth.refreshTokenSecret;
          case 'auth.refreshTokenTtl':
            return auth.refreshTokenTtl;
          default:
            throw new Error(`Unexpected config path: ${path}`);
        }
      },
    } as ConfigService<ApplicationConfig, true>;
  }

  it('issues and verifies access and refresh tokens', async () => {
    const service = new JwtAuthTokenService(createConfigService());
    const tokens = await service.issueTokens({
      userId: 'user-01',
      email: 'traveler@example.com',
      roles: ['traveler'],
    });

    await expect(
      service.verifyAccessToken(tokens.accessToken),
    ).resolves.toEqual({
      userId: 'user-01',
      email: 'traveler@example.com',
      roles: ['traveler'],
    });
    const refreshTokenSubject = await service.verifyRefreshToken(
      tokens.refreshToken,
    );

    expect(refreshTokenSubject.userId).toBe('user-01');
    expect(refreshTokenSubject.tokenId).toEqual(expect.any(String));
    expect(refreshTokenSubject.expiresAt).toBeInstanceOf(Date);
  });

  it('rejects a refresh token when used as an access token', async () => {
    const service = new JwtAuthTokenService(createConfigService());
    const tokens = await service.issueTokens({
      userId: 'user-01',
      email: 'traveler@example.com',
      roles: ['traveler'],
    });

    await expect(
      service.verifyAccessToken(tokens.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects expired access tokens', async () => {
    const dateNowSpy = jest.spyOn(Date, 'now');
    dateNowSpy.mockReturnValue(new Date('2026-04-14T10:00:00.000Z').getTime());

    const service = new JwtAuthTokenService(
      createConfigService({
        accessTokenTtl: '1s',
      }),
    );
    const tokens = await service.issueTokens({
      userId: 'user-01',
      email: 'traveler@example.com',
      roles: ['traveler'],
    });

    dateNowSpy.mockReturnValue(new Date('2026-04-14T10:00:02.000Z').getTime());

    await expect(
      service.verifyAccessToken(tokens.accessToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    dateNowSpy.mockRestore();
  });

  it('rejects refresh tokens after they have been revoked', async () => {
    const service = new JwtAuthTokenService(createConfigService());
    const tokens = await service.issueTokens({
      userId: 'user-01',
      email: 'traveler@example.com',
      roles: ['traveler'],
    });

    const revokedRefreshTokenSubject = await service.revokeRefreshToken(
      tokens.refreshToken,
    );

    expect(revokedRefreshTokenSubject.userId).toBe('user-01');
    expect(revokedRefreshTokenSubject.tokenId).toEqual(expect.any(String));
    expect(revokedRefreshTokenSubject.expiresAt).toBeInstanceOf(Date);
    await expect(
      service.verifyRefreshToken(tokens.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.revokeRefreshToken(tokens.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects unsupported ttl formats', () => {
    expect(
      () =>
        new JwtAuthTokenService(
          createConfigService({
            accessTokenTtl: '900',
          }),
        ),
    ).toThrow(InternalServerErrorException);
  });
});
