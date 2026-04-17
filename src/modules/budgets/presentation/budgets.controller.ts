import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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
