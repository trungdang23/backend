import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ItinerariesModule } from '../itineraries/itineraries.module';
import { TripsModule } from '../trips/trips.module';
import { GetTripBudgetSummaryService } from './application/services/get-trip-budget-summary.service';
import { BudgetsController } from './presentation/budgets.controller';

@Module({
  imports: [AuthModule, ItinerariesModule, TripsModule],
  controllers: [BudgetsController],
  providers: [GetTripBudgetSummaryService],
})
export class BudgetsModule {}
