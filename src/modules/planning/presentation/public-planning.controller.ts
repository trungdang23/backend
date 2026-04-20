import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../auth/presentation/decorators/public.decorator';
import { GetPublicTripPlannerService } from '../application/services/get-public-trip-planner.service';
import { TripPlannerResponseDto } from './dto/trip-planner-response.dto';

@ApiTags('public-planning')
@Public()
@Controller('public/trips')
export class PublicPlanningController {
  constructor(
    private readonly getPublicTripPlanner: GetPublicTripPlannerService,
  ) {}

  @Get(':tripId/planner')
  async getPlanner(@Param('tripId') tripId: string) {
    const result = await this.getPublicTripPlanner.execute(tripId);

    return TripPlannerResponseDto.from(result);
  }
}
