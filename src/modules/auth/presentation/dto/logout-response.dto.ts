import { ApiProperty } from '@nestjs/swagger';

import type { LogoutAuthSessionResult } from '../../application/services/logout-auth-session.service';

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  loggedOut!: true;

  static from(result: LogoutAuthSessionResult): LogoutResponseDto {
    return {
      loggedOut: result.loggedOut,
    };
  }
}
