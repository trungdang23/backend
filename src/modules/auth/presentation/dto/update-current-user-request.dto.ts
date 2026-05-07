import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCurrentUserRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName!: string;
}
