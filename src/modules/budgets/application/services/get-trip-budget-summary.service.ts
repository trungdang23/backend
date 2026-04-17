import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  ITINERARY_REPOSITORY,
  type ItineraryRepositoryPort,
} from '../../../itineraries/application/ports/itinerary-repository.port';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { TripBudgetSummary } from '../../domain/trip-budget-summary';

export interface GetTripBudgetSummaryInput {
  userId: string;
  tripId: string;
}

@Injectable()
export class GetTripBudgetSummaryService
  implements UseCase<GetTripBudgetSummaryInput, TripBudgetSummary>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(ITINERARY_REPOSITORY)
    private readonly itineraryRepository: ItineraryRepositoryPort,
  ) {}

  async execute(
    input: GetTripBudgetSummaryInput,
  ): Promise<TripBudgetSummary> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    const dayAggregates =
      await this.itineraryRepository.listDayAggregatesByTrip({
        tripId: trip.id,
      });

    const totalActivities = dayAggregates.reduce(
      (sum, aggregate) => sum + aggregate.activities.length,
      0,
    );
    const totalPlannedAmount = dayAggregates.reduce(
      (sum, aggregate) =>
        sum +
        aggregate.day.costAmount +
        aggregate.activities.reduce(
          (activitySum, activity) => activitySum + activity.costAmount,
          0,
        ),
      0,
    );

    return TripBudgetSummary.create({
      tripId: trip.id,
      currency: trip.budgetCurrency,
      totalBudgetAmount: trip.budgetAmount,
      totalPlannedAmount,
      totalDays: dayAggregates.length,
      totalActivities,
    });
  }
}
