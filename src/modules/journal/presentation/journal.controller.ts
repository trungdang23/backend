import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { GetTripJournalService } from '../application/services/get-trip-journal.service';
import { SaveTripJournalService } from '../application/services/save-trip-journal.service';
import type { JournalPage, JournalSceneObject } from '../domain/trip-journal';
import { SaveTripJournalRequestDto } from './dto/save-trip-journal-request.dto';
import { TripJournalResponseDto } from './dto/trip-journal-response.dto';

@ApiTags('journal')
@ApiBearerAuth()
@Controller()
@UseGuards(AccessTokenAuthGuard)
export class JournalController {
  constructor(
    private readonly getTripJournal: GetTripJournalService,
    private readonly saveTripJournal: SaveTripJournalService,
  ) {}

  @Get('trips/:tripId/journal')
  async getJournal(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const result = await this.getTripJournal.execute({
      userId: authenticatedUser.userId,
      tripId,
    });

    return TripJournalResponseDto.from(result);
  }

  @Put('trips/:tripId/journal')
  async saveJournal(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() input: SaveTripJournalRequestDto,
  ) {
    const result = await this.saveTripJournal.execute({
      userId: authenticatedUser.userId,
      tripId,
      sceneVersion: input.sceneVersion,
      page: input.page as unknown as JournalPage,
      objects: input.objects as unknown as JournalSceneObject[],
    });

    return TripJournalResponseDto.from(result);
  }
}
