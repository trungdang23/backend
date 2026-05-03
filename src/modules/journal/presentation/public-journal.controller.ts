import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../auth/presentation/decorators/public.decorator';
import { GetPublicTripJournalService } from '../application/services/get-public-trip-journal.service';
import { TripJournalResponseDto } from './dto/trip-journal-response.dto';

@ApiTags('public-journal')
@Public()
@Controller('public/trips')
export class PublicJournalController {
  constructor(
    private readonly getPublicTripJournal: GetPublicTripJournalService,
  ) {}

  @Get(':tripId/journal')
  async getJournal(@Param('tripId') tripId: string) {
    const result = await this.getPublicTripJournal.execute(tripId);

    return TripJournalResponseDto.from(result);
  }
}
