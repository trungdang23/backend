import { IsString, MaxLength, MinLength } from 'class-validator';

export class LogoutRequestDto {
  @IsString()
  @MinLength(32)
  @MaxLength(4096)
  refreshToken!: string;
}
