import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LogoutRequestDto {
  @ApiProperty({ minLength: 32, maxLength: 4096 })
  @IsString()
  @MinLength(32)
  @MaxLength(4096)
  refreshToken!: string;
}
