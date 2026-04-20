import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../auth/presentation/decorators/public.decorator';
import { GetPublicTripDetailService } from '../application/services/get-public-trip-detail.service';
import { TripResponseDto } from './dto/trip-response.dto';

@ApiTags('public-trips')
@Public()
@Controller('public/trips')
export class PublicTripsController {
  constructor(private readonly getPublicTripDetail: GetPublicTripDetailService) {}

  @Get(':tripId')
  async detail(@Param('tripId') tripId: string) {
    const trip = await this.getPublicTripDetail.execute(tripId);

    return TripResponseDto.from(trip);
  }
}
