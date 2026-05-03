import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../auth/presentation/decorators/public.decorator';
import { GetPublicTripJournalService } from '../application/services/get-public-trip-journal.service';
import { ListPublicJournalsService } from '../application/services/list-public-journals.service';
import {
  TripJournalListResponseDto,
  TripJournalResponseDto,
} from './dto/trip-journal-response.dto';

@ApiTags('public-journal')
@Public()
@Controller()
export class PublicJournalController {
  constructor(
    private readonly getPublicTripJournal: GetPublicTripJournalService,
    private readonly listPublicJournals: ListPublicJournalsService,
  ) {}

  @Get('public/journals')
  async listJournals() {
    const results = await this.listPublicJournals.execute();

    return TripJournalListResponseDto.from(results);
  }

  @Get('public/trips/:tripId/journal')
  async getJournal(@Param('tripId') tripId: string) {
    const result = await this.getPublicTripJournal.execute(tripId);

    return TripJournalResponseDto.from(result);
  }
}
