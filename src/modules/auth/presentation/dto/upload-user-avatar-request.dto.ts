import { ApiProperty } from '@nestjs/swagger';

export class UploadUserAvatarRequestDto {
  @ApiProperty({
    description: 'Avatar image file.',
    format: 'binary',
    type: 'string',
  })
  file!: unknown;
}
