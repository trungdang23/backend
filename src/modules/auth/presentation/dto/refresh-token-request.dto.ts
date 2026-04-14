import { IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsString()
  @MinLength(32)
  @MaxLength(4096)
  refreshToken!: string;
}
