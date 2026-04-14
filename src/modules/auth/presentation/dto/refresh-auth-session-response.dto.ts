import { ApiProperty } from '@nestjs/swagger';

import type { AuthTokens } from '../../application/auth-tokens';
import { AuthTokensResponseDto } from './auth-tokens-response.dto';

export class RefreshAuthSessionResponseDto {
  @ApiProperty({ type: () => AuthTokensResponseDto })
  tokens!: AuthTokensResponseDto;

  static from(tokens: AuthTokens): RefreshAuthSessionResponseDto {
    return {
      tokens: AuthTokensResponseDto.from(tokens),
    };
  }
}
