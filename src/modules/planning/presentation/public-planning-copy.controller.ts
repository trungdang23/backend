import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
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
