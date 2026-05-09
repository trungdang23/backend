import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import {
  ApiErrorEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import { CopyPublicTripPlannerService } from '../application/services/copy-public-trip-planner.service';
import { TripPlannerResponseDto } from './dto/trip-planner-response.dto';

@ApiTags('public-planning')
@ApiBearerAuth()
@Controller('public/trips')
@UseGuards(AccessTokenAuthGuard)
export class PublicPlanningCopyController {
  constructor(
    private readonly copyPublicTripPlanner: CopyPublicTripPlannerService,
  ) {}

  @Post(':tripId/copy')
  @ApiOperation({
    summary: 'Copy a public trip planner into the authenticated user account.',
  })
  @ApiSuccessEnvelopeResponse(TripPlannerResponseDto, {
    description: 'Returns the copied owned trip and planner tree.',
    status: 201,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested source trip is private or does not exist.',
    status: 404,
  })
  async copyPlanner(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const result = await this.copyPublicTripPlanner.execute({
      sourceTripId: tripId,
      userId: authenticatedUser.userId,
    });

    return TripPlannerResponseDto.from(result);
  }
}
