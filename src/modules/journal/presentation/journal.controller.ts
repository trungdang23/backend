import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  ApiErrorEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { DeleteTripJournalService } from '../application/services/delete-trip-journal.service';
import { GetTripJournalService } from '../application/services/get-trip-journal.service';
import { ListUserJournalsService } from '../application/services/list-user-journals.service';
import { PresentTripJournalService } from '../application/services/present-trip-journal.service';
import { SaveTripJournalService } from '../application/services/save-trip-journal.service';
import { UpdateTripJournalVisibilityService } from '../application/services/update-trip-journal-visibility.service';
import type { JournalPage, JournalSceneObject } from '../domain/trip-journal';
import { SaveTripJournalRequestDto } from './dto/save-trip-journal-request.dto';
import {
  TripJournalListResponseDto,
  TripJournalResponseDto,
} from './dto/trip-journal-response.dto';
import { UpdateTripJournalRequestDto } from './dto/update-trip-journal-request.dto';

@ApiTags('journal')
@ApiBearerAuth()
@Controller()
@UseGuards(AccessTokenAuthGuard)
export class JournalController {
  constructor(
    private readonly deleteTripJournal: DeleteTripJournalService,
    private readonly getTripJournal: GetTripJournalService,
    private readonly listUserJournals: ListUserJournalsService,
    private readonly presentTripJournal: PresentTripJournalService,
    private readonly saveTripJournal: SaveTripJournalService,
    private readonly updateTripJournalVisibility: UpdateTripJournalVisibilityService,
  ) {}

  @Get('journals/mine')
  @ApiOperation({
    summary: 'List journals owned by the authenticated user.',
  })
  @ApiSuccessEnvelopeResponse(TripJournalResponseDto, {
    description:
      'Returns the authenticated user journal list with trip metadata.',
    isArray: true,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  async listMine(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    const results = await this.listUserJournals.execute({
      userId: authenticatedUser.userId,
    });

    return TripJournalListResponseDto.from(
      await this.presentTripJournal.presentMany(results),
    );
  }

  @Get('trips/:tripId/journal')
  @ApiOperation({ summary: 'Get the journal scene for an owned trip.' })
  @ApiSuccessEnvelopeResponse(TripJournalResponseDto, {
    description:
      'Returns the owned trip and its current journal scene snapshot.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
  async getJournal(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const result = await this.presentTripJournal.present(
      await this.getTripJournal.execute({
        userId: authenticatedUser.userId,
        tripId,
      }),
    );

    return TripJournalResponseDto.from(result);
  }

  @Put('trips/:tripId/journal')
  @ApiOperation({ summary: 'Create or replace the journal scene for an owned trip.' })
  @ApiSuccessEnvelopeResponse(TripJournalResponseDto, {
    description: 'Returns the saved journal scene snapshot.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for the journal scene payload.',
    status: 400,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
  async saveJournal(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() input: SaveTripJournalRequestDto,
  ) {
    const result = await this.presentTripJournal.present(
      await this.saveTripJournal.execute({
        userId: authenticatedUser.userId,
        tripId,
        sceneVersion: input.sceneVersion,
        page: input.page as unknown as JournalPage,
        objects: input.objects as unknown as JournalSceneObject[],
      }),
    );

    return TripJournalResponseDto.from(result);
  }

  @Patch('trips/:tripId/journal')
  @ApiOperation({ summary: 'Update journal visibility for an owned trip.' })
  @ApiSuccessEnvelopeResponse(TripJournalResponseDto, {
    description: 'Returns the owned trip journal after the visibility update.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for the journal visibility payload.',
    status: 400,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
  async updateJournal(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() input: UpdateTripJournalRequestDto,
  ) {
    const result = await this.presentTripJournal.present(
      await this.updateTripJournalVisibility.execute({
        userId: authenticatedUser.userId,
        tripId,
        visibility: input.visibility,
      }),
    );

    return TripJournalResponseDto.from(result);
  }

  @Delete('trips/:tripId/journal')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete the journal scene for an owned trip.' })
  @ApiNoContentResponse({
    description: 'Deletes the owned trip journal scene.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
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
