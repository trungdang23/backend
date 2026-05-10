import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiErrorEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { GetTripBudgetSummaryService } from '../application/services/get-trip-budget-summary.service';
import { BudgetSummaryResponseDto } from './dto/budget-summary-response.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('trips/:tripId/budget-summary')
@UseGuards(AccessTokenAuthGuard)
export class BudgetsController {
  constructor(
    private readonly getTripBudgetSummary: GetTripBudgetSummaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get the budget summary for an owned trip.' })
  @ApiSuccessEnvelopeResponse(BudgetSummaryResponseDto, {
    description:
      'Returns the owned trip budget summary derived from planner nodes.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
  async getSummary(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const summary = await this.getTripBudgetSummary.execute({
      userId: authenticatedUser.userId,
      tripId,
    });

    return BudgetSummaryResponseDto.from(summary);
  }
}
