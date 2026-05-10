import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

import { JOURNAL_VISIBILITIES } from '../../domain/journal-visibility';

export class UpdateTripJournalRequestDto {
  @ApiProperty({ enum: JOURNAL_VISIBILITIES, example: 'public' })
  @IsString()
  @IsIn(JOURNAL_VISIBILITIES)
  visibility!: string;
}
