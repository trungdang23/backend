import { ApiProperty } from '@nestjs/swagger';

import type { AuthTokens } from '../../application/auth-tokens';

export class AuthTokensResponseDto {
  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  accessTokenExpiresIn!: number;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  refreshTokenExpiresIn!: number;

  static from(tokens: AuthTokens): AuthTokensResponseDto {
    return {
      tokenType: tokens.tokenType,
      accessToken: tokens.accessToken,
      accessTokenExpiresIn: tokens.accessTokenExpiresIn,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
    };
  }
}
