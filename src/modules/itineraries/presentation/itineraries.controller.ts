import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { AddItineraryActivityService } from '../application/services/add-itinerary-activity.service';
import { AddItineraryDayService } from '../application/services/add-itinerary-day.service';
import { DeleteItineraryActivityService } from '../application/services/delete-itinerary-activity.service';
import { DeleteItineraryDayService } from '../application/services/delete-itinerary-day.service';
import { GetTripItineraryService } from '../application/services/get-trip-itinerary.service';
import { UpdateItineraryActivityService } from '../application/services/update-itinerary-activity.service';
import { UpdateItineraryDayService } from '../application/services/update-itinerary-day.service';
import { CreateItineraryActivityRequestDto } from './dto/create-itinerary-activity-request.dto';
import { CreateItineraryDayRequestDto } from './dto/create-itinerary-day-request.dto';
import { ItineraryActivityResponseDto } from './dto/itinerary-activity-response.dto';
import { ItineraryDayResponseDto } from './dto/itinerary-day-response.dto';
import { TripItineraryResponseDto } from './dto/trip-itinerary-response.dto';
import { UpdateItineraryActivityRequestDto } from './dto/update-itinerary-activity-request.dto';
import { UpdateItineraryDayRequestDto } from './dto/update-itinerary-day-request.dto';

@ApiTags('itineraries')
@ApiBearerAuth()
@Controller('trips/:tripId/itinerary')
@UseGuards(AccessTokenAuthGuard)
export class ItinerariesController {
  constructor(
    private readonly addItineraryActivity: AddItineraryActivityService,
    private readonly addItineraryDay: AddItineraryDayService,
    private readonly deleteItineraryActivity: DeleteItineraryActivityService,
    private readonly deleteItineraryDay: DeleteItineraryDayService,
    private readonly getTripItinerary: GetTripItineraryService,
    private readonly updateItineraryActivity: UpdateItineraryActivityService,
    private readonly updateItineraryDay: UpdateItineraryDayService,
  ) {}

  @Get()
  async getItinerary(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const result = await this.getTripItinerary.execute({
      userId: authenticatedUser.userId,
      tripId,
    });

    return TripItineraryResponseDto.from(result);
  }

  @Post('days')
  async createDay(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() input: CreateItineraryDayRequestDto,
  ) {
    const itineraryDay = await this.addItineraryDay.execute({
      userId: authenticatedUser.userId,
      tripId,
      date: input.date,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      notes: input.notes,
      costAmount: input.costAmount,
      costCurrency: input.costCurrency,
      imageUrls: input.imageUrls,
    });

    return ItineraryDayResponseDto.fromDay(itineraryDay);
  }

  @Patch('days/:dayId')
  async updateDay(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() input: UpdateItineraryDayRequestDto,
  ) {
    const itineraryDay = await this.updateItineraryDay.execute({
      userId: authenticatedUser.userId,
      tripId,
      dayId,
      date: input.date,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      notes: input.notes,
      costAmount: input.costAmount,
      costCurrency: input.costCurrency,
      imageUrls: input.imageUrls,
    });

    return ItineraryDayResponseDto.fromDay(itineraryDay);
  }

  @Delete('days/:dayId')
  @HttpCode(204)
  async deleteDay(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
  ) {
    await this.deleteItineraryDay.execute({
      userId: authenticatedUser.userId,
      tripId,
      dayId,
    });
  }

  @Post('days/:dayId/activities')
  async createActivity(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() input: CreateItineraryActivityRequestDto,
  ) {
    const activity = await this.addItineraryActivity.execute({
      userId: authenticatedUser.userId,
      tripId,
      dayId,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      notes: input.notes,
      costAmount: input.costAmount,
      costCurrency: input.costCurrency,
      imageUrls: input.imageUrls,
    });

    return ItineraryActivityResponseDto.from(activity);
  }

  @Patch('days/:dayId/activities/:activityId')
  async updateActivity(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('activityId') activityId: string,
    @Body() input: UpdateItineraryActivityRequestDto,
  ) {
    const activity = await this.updateItineraryActivity.execute({
      userId: authenticatedUser.userId,
      tripId,
      dayId,
      activityId,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      notes: input.notes,
      costAmount: input.costAmount,
      costCurrency: input.costCurrency,
      imageUrls: input.imageUrls,
    });

    return ItineraryActivityResponseDto.from(activity);
  }

  @Delete('days/:dayId/activities/:activityId')
  @HttpCode(204)
  async deleteActivity(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('activityId') activityId: string,
  ) {
    await this.deleteItineraryActivity.execute({
      userId: authenticatedUser.userId,
      tripId,
      dayId,
      activityId,
    });
  }
}
