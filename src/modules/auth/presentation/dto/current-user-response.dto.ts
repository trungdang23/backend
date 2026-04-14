import { ApiProperty } from '@nestjs/swagger';

import type { UserProfile } from '../../../users/application/user-profile';
import { UserResponseDto } from './user-response.dto';

export class CurrentUserResponseDto {
  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;

  static from(user: UserProfile): CurrentUserResponseDto {
    return {
      user: UserResponseDto.from(user),
    };
  }
}
