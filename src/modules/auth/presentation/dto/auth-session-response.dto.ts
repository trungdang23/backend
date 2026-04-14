import { ApiProperty } from '@nestjs/swagger';

import type { AuthSession } from '../../application/auth-session';
import { AuthTokensResponseDto } from './auth-tokens-response.dto';
import { UserResponseDto } from './user-response.dto';

export class AuthSessionResponseDto {
  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ type: () => AuthTokensResponseDto })
  tokens!: AuthTokensResponseDto;

  static from(session: AuthSession): AuthSessionResponseDto {
    return {
      user: UserResponseDto.from(session.user),
      tokens: AuthTokensResponseDto.from(session.tokens),
    };
  }
}
