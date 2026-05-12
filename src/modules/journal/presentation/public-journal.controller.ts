import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiErrorEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { TripAuthorPresenterService } from '../../trips/application/services/trip-author-presenter.service';
import { GetPublicTripJournalService } from '../application/services/get-public-trip-journal.service';
import { ListPublicJournalsService } from '../application/services/list-public-journals.service';
import { PresentTripJournalService } from '../application/services/present-trip-journal.service';
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
    private readonly presentTripJournal: PresentTripJournalService,
    private readonly tripAuthorPresenter: TripAuthorPresenterService,
  ) {}

  @Get('public/journals')
  @ApiOperation({ summary: 'List public journals available for community discovery.' })
  @ApiSuccessEnvelopeResponse(TripJournalResponseDto, {
    description: 'Returns public journals with their related trip metadata.',
    isArray: true,
  })
  async listJournals() {
    const results = await this.presentTripJournal.presentMany(
      await this.listPublicJournals.execute(),
    );
    const authorsByTripId = await this.tripAuthorPresenter.presentMany(
      results.map((result) => result.trip),
    );

    return TripJournalListResponseDto.from(results, authorsByTripId);
  }

  @Get('public/trips/:tripId/journal')
  @ApiOperation({ summary: 'Get the public journal for a trip.' })
  @ApiSuccessEnvelopeResponse(TripJournalResponseDto, {
    description: 'Returns the requested public trip journal snapshot.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'The journal is private and cannot be read on the public route.',
    status: 403,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested public journal does not exist.',
    status: 404,
  })
  async getJournal(@Param('tripId') tripId: string) {
    const result = await this.presentTripJournal.present(
      await this.getPublicTripJournal.execute(tripId),
    );
    const author = await this.tripAuthorPresenter.present(result.trip);

    return TripJournalResponseDto.from(result, author);
  }
}
