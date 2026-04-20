import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlanningModule } from '../planning/planning.module';
import { TripsModule } from '../trips/trips.module';
import { GetTripBudgetSummaryService } from './application/services/get-trip-budget-summary.service';
import { BudgetsController } from './presentation/budgets.controller';

@Module({
  imports: [AuthModule, PlanningModule, TripsModule],
  controllers: [BudgetsController],
  providers: [GetTripBudgetSummaryService],
})
export class BudgetsModule {}
