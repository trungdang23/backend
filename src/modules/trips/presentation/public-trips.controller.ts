import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { buildSuccessResponse } from '../../../app/http/api-response';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { GetPublicTripDetailService } from '../application/services/get-public-trip-detail.service';
import { ListPublicTripsService } from '../application/services/list-public-trips.service';
import { ListTripsQueryDto } from './dto/list-trips-query.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { formatTripSort, parseTripSort } from './trip-sort-query';

@ApiTags('public-trips')
@Public()
@Controller('public/trips')
export class PublicTripsController {
  constructor(
    private readonly getPublicTripDetail: GetPublicTripDetailService,
    private readonly listPublicTrips: ListPublicTripsService,
  ) {}

  @Get()
  async list(@Query() query: ListTripsQueryDto) {
    const page = query.page ?? 0;
    const size = query.size ?? 20;
    const sort = parseTripSort(query.sort);
    const result = await this.listPublicTrips.execute({
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
  async detail(@Param('tripId') tripId: string) {
    const trip = await this.getPublicTripDetail.execute(tripId);

    return TripResponseDto.from(trip);
  }
}
