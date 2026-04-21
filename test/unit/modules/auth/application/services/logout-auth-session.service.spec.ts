import { UnauthorizedException } from '@nestjs/common';

import { LogoutAuthSessionService } from '../../../../../../src/modules/auth/application/services/logout-auth-session.service';
import type { AuthTokenService } from '../../../../../../src/modules/auth/application/ports/auth-token-service.port';

describe('LogoutAuthSessionService', () => {
  it('returns a successful logout result for a valid refresh token', async () => {
    const revokeRefreshToken = jest.fn().mockResolvedValue({
      userId: 'user-01',
      tokenId: 'refresh-token-01',
      expiresAt: new Date('2026-04-21T10:00:00.000Z'),
    });
    const service = new LogoutAuthSessionService({
      revokeRefreshToken,
    } as unknown as AuthTokenService);

    const result = await service.execute({
      refreshToken: 'valid-refresh-token',
    });

    expect(result).toEqual({
      loggedOut: true,
    });
    expect(revokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
  });

  it('rejects an invalid refresh token', async () => {
    const service = new LogoutAuthSessionService({
      revokeRefreshToken: jest
        .fn()
        .mockRejectedValue(
          new UnauthorizedException('Refresh token is invalid.'),
        ),
    } as unknown as AuthTokenService);

    await expect(
      service.execute({
        refreshToken: 'invalid-refresh-token',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
