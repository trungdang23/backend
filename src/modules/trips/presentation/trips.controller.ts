import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { buildSuccessResponse } from '../../../app/http/api-response';
import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import {
  DEFAULT_TRIP_SORT,
  TRIP_SORT_FIELDS,
  type TripSort,
  type TripSortDirection,
  type TripSortField,
} from '../application/trip-sort';
import { CreateTripService } from '../application/services/create-trip.service';
import { DeleteTripService } from '../application/services/delete-trip.service';
import { GetTripDetailService } from '../application/services/get-trip-detail.service';
import { ListTripsService } from '../application/services/list-trips.service';
import { UpdateTripService } from '../application/services/update-trip.service';
import { CreateTripRequestDto } from './dto/create-trip-request.dto';
import { ListTripsQueryDto } from './dto/list-trips-query.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { UpdateTripRequestDto } from './dto/update-trip-request.dto';

@ApiTags('trips')
@ApiBearerAuth()
@Controller('trips')
@UseGuards(AccessTokenAuthGuard)
export class TripsController {
  constructor(
    private readonly createTrip: CreateTripService,
    private readonly listTrips: ListTripsService,
    private readonly getTripDetail: GetTripDetailService,
    private readonly updateTrip: UpdateTripService,
    private readonly deleteTrip: DeleteTripService,
  ) {}

  @Post()
  async create(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() input: CreateTripRequestDto,
  ) {
    const trip = await this.createTrip.execute({
      userId: authenticatedUser.userId,
      name: input.name,
      destination: input.destination,
      summaryNotes: input.summaryNotes,
      coverImageUrl: input.coverImageUrl,
      startDate: input.startDate,
      endDate: input.endDate,
      timezone: input.timezone,
      budgetAmount: input.budgetAmount,
      budgetCurrency: input.budgetCurrency,
    });

    return TripResponseDto.from(trip);
  }

  @Get()
  async list(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Query() query: ListTripsQueryDto,
  ) {
    const page = query.page ?? 0;
    const size = query.size ?? 20;
    const sort = parseTripSort(query.sort);
    const result = await this.listTrips.execute({
      userId: authenticatedUser.userId,
      page,
      size,
      sort,
    });

    return buildSuccessResponse(
      result.trips.map((trip) => TripResponseDto.from(trip)),
      {
        page,
        size,
        sort: formatTripSort(sort),
        totalElements: result.totalElements,
        totalPages: Math.ceil(result.totalElements / size),
      },
    );
  }

  @Get(':tripId')
  async detail(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const trip = await this.getTripDetail.execute({
      userId: authenticatedUser.userId,
      tripId,
    });

    return TripResponseDto.from(trip);
  }

  @Patch(':tripId')
  async update(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() input: UpdateTripRequestDto,
  ) {
    const trip = await this.updateTrip.execute({
      userId: authenticatedUser.userId,
      tripId,
      name: input.name,
      destination: input.destination,
      summaryNotes: input.summaryNotes,
      coverImageUrl: input.coverImageUrl,
      startDate: input.startDate,
      endDate: input.endDate,
      timezone: input.timezone,
      budgetAmount: input.budgetAmount,
      budgetCurrency: input.budgetCurrency,
    });

    return TripResponseDto.from(trip);
  }

  @Delete(':tripId')
  async delete(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const trip = await this.deleteTrip.execute({
      userId: authenticatedUser.userId,
      tripId,
    });

    return TripResponseDto.from(trip);
  }
}

function parseTripSort(sortValue?: string): TripSort {
  if (sortValue === undefined || sortValue.trim().length === 0) {
    return DEFAULT_TRIP_SORT;
  }

  const [field, direction, ...rest] = sortValue.trim().split(',');

  if (rest.length > 0) {
    throw new BadRequestException(
      'Sort must follow the format "<field>,<direction>".',
    );
  }

  if (!TRIP_SORT_FIELDS.includes(field as TripSortField)) {
    throw new BadRequestException('Trip sort field is not supported.');
  }

  if (direction !== 'asc' && direction !== 'desc') {
    throw new BadRequestException('Trip sort direction must be asc or desc.');
  }

  return {
    field: field as TripSortField,
    direction: direction as TripSortDirection,
  };
}

function formatTripSort(sort: TripSort): string {
  return `${sort.field},${sort.direction}`;
}
