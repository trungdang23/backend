import {
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { buildSuccessResponse } from '../../../app/http/api-response';
import {
  ApiErrorEnvelopeResponse,
  ApiPaginatedSuccessEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { CreateTripService } from '../application/services/create-trip.service';
import { DeleteTripService } from '../application/services/delete-trip.service';
import { GetTripDetailService } from '../application/services/get-trip-detail.service';
import { ListTripsService } from '../application/services/list-trips.service';
import { UpdateTripService } from '../application/services/update-trip.service';
import { CreateTripRequestDto } from './dto/create-trip-request.dto';
import { ListTripsQueryDto } from './dto/list-trips-query.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { formatTripSort, parseTripSort } from './trip-sort-query';
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
  @ApiOperation({ summary: 'Create a new trip owned by the authenticated user.' })
  @ApiSuccessEnvelopeResponse(TripResponseDto, {
    description: 'Returns the newly created trip.',
    status: 201,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for the trip payload.',
    status: 400,
  })
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
      budgetMode: input.budgetMode,
      manualBudgetAmount: input.manualBudgetAmount,
      manualBudgetCurrency: input.manualBudgetCurrency,
      visibility: input.visibility,
    });

    return TripResponseDto.from(trip);
  }

  @Get()
  @ApiOperation({ summary: 'List trips owned by the authenticated user.' })
  @ApiPaginatedSuccessEnvelopeResponse(
    TripResponseDto,
    'Returns the authenticated user trip list with pagination metadata.',
  )
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for one or more trip query parameters.',
    status: 400,
  })
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
  @ApiOperation({ summary: 'Get a single owned trip by id.' })
  @ApiSuccessEnvelopeResponse(TripResponseDto, {
    description: 'Returns the requested owned trip.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
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
  @ApiOperation({ summary: 'Update an owned trip.' })
  @ApiSuccessEnvelopeResponse(TripResponseDto, {
    description: 'Returns the updated trip.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for the trip update payload.',
    status: 400,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
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
      budgetMode: input.budgetMode,
      manualBudgetAmount: input.manualBudgetAmount,
      manualBudgetCurrency: input.manualBudgetCurrency,
      visibility: input.visibility,
    });

    return TripResponseDto.from(trip);
  }

  @Delete(':tripId')
  @ApiOperation({ summary: 'Delete an owned trip.' })
  @ApiSuccessEnvelopeResponse(TripResponseDto, {
    description: 'Returns the deleted trip snapshot.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
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
