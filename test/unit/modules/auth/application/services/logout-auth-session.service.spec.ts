import { UnauthorizedException } from '@nestjs/common';

import { LogoutAuthSessionService } from '../../../../../../src/modules/auth/application/services/logout-auth-session.service';
import type { AuthTokenService } from '../../../../../../src/modules/auth/application/ports/auth-token-service.port';

describe('LogoutAuthSessionService', () => {
  it('returns a successful logout result for a valid refresh token', async () => {
    const verifyRefreshToken = jest.fn().mockResolvedValue({
      userId: 'user-01',
    });
    const service = new LogoutAuthSessionService({
      verifyRefreshToken,
    } as unknown as AuthTokenService);

    const result = await service.execute({
      refreshToken: 'valid-refresh-token',
    });

    expect(result).toEqual({
      loggedOut: true,
    });
    expect(verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
  });

  it('rejects an invalid refresh token', async () => {
    const service = new LogoutAuthSessionService({
      verifyRefreshToken: jest
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
