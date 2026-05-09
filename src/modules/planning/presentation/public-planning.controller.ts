import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../auth/presentation/decorators/public.decorator';
import {
  ApiErrorEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
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
  @ApiOperation({ summary: 'Get the full planner tree for a public trip.' })
  @ApiSuccessEnvelopeResponse(TripPlannerResponseDto, {
    description: 'Returns the public trip and its full public planner node tree.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'The trip is private and cannot be read on the public route.',
    status: 403,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested public trip does not exist.',
    status: 404,
  })
  async getPlanner(@Param('tripId') tripId: string) {
    const result = await this.getPublicTripPlanner.execute(tripId);

    return TripPlannerResponseDto.from(result);
  }
}
