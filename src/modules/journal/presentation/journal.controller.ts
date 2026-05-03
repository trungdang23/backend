import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { DeleteTripJournalService } from '../application/services/delete-trip-journal.service';
import { GetTripJournalService } from '../application/services/get-trip-journal.service';
import { ListUserJournalsService } from '../application/services/list-user-journals.service';
import { SaveTripJournalService } from '../application/services/save-trip-journal.service';
import type { JournalPage, JournalSceneObject } from '../domain/trip-journal';
import { SaveTripJournalRequestDto } from './dto/save-trip-journal-request.dto';
import {
  TripJournalListResponseDto,
  TripJournalResponseDto,
} from './dto/trip-journal-response.dto';

@ApiTags('journal')
@ApiBearerAuth()
@Controller()
@UseGuards(AccessTokenAuthGuard)
export class JournalController {
  constructor(
    private readonly deleteTripJournal: DeleteTripJournalService,
    private readonly getTripJournal: GetTripJournalService,
    private readonly listUserJournals: ListUserJournalsService,
    private readonly saveTripJournal: SaveTripJournalService,
  ) {}

  @Get('journals/mine')
  async listMine(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    const results = await this.listUserJournals.execute({
      userId: authenticatedUser.userId,
    });

    return TripJournalListResponseDto.from(results);
  }

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

  @Delete('trips/:tripId/journal')
  @HttpCode(204)
  async deleteJournal(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    await this.deleteTripJournal.execute({
      userId: authenticatedUser.userId,
      tripId,
    });
  }
}
