import { ApiProperty } from '@nestjs/swagger';

export class UploadTripJournalAssetRequestDto {
  @ApiProperty({
    description: 'Image file to upload into the owner journal asset library.',
    format: 'binary',
    type: 'string',
  })
  file!: unknown;
}
