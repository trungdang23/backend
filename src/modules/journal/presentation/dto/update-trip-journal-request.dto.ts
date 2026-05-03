import { IsIn, IsString } from 'class-validator';

import { JOURNAL_VISIBILITIES } from '../../domain/journal-visibility';

export class UpdateTripJournalRequestDto {
  @IsString()
  @IsIn(JOURNAL_VISIBILITIES)
  visibility!: string;
}
