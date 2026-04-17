import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { ItineraryActivity } from '../../domain/itinerary-activity';
import {
  ITINERARY_REPOSITORY,
  type ItineraryRepositoryPort,
} from '../ports/itinerary-repository.port';
import { rethrowItineraryDomainError } from './map-itinerary-domain-error';

export interface UpdateItineraryActivityInput {
  userId: string;
  tripId: string;
  dayId: string;
  activityId: string;
  title?: string;
  startsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount?: number;
  costCurrency?: string;
}

@Injectable()
export class UpdateItineraryActivityService
  implements UseCase<UpdateItineraryActivityInput, ItineraryActivity>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(ITINERARY_REPOSITORY)
    private readonly itineraryRepository: ItineraryRepositoryPort,
  ) {}

  async execute(
    input: UpdateItineraryActivityInput,
  ): Promise<ItineraryActivity> {
    if (
      input.title === undefined &&
      input.startsAt === undefined &&
      input.location === undefined &&
      input.notes === undefined &&
      input.costAmount === undefined &&
      input.costCurrency === undefined
    ) {
      throw new BadRequestException(
        'At least one field must be provided to update an itinerary activity.',
      );
    }

    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    const dayAggregate =
      await this.itineraryRepository.findDayAggregateByIdForTrip({
        tripId: trip.id,
        dayId: input.dayId,
      });

    if (dayAggregate === null) {
      throw new NotFoundException('Itinerary day not found.');
    }

    const existingActivity = dayAggregate.activities.find(
      (activity) => activity.id === input.activityId,
    );

    if (existingActivity === undefined) {
      throw new NotFoundException('Itinerary activity not found.');
    }

    const nextCostCurrency = normalizeBudgetCurrency(
      input.costCurrency ?? existingActivity.costCurrency,
    );

    if (nextCostCurrency !== trip.budgetCurrency) {
      throw new BadRequestException(
        'Activity cost currency must match the trip budget currency.',
      );
    }

    try {
      const updatedActivity = existingActivity.update({
        title: input.title,
        startsAt: input.startsAt,
        location: input.location,
        notes: input.notes,
        costAmount: input.costAmount,
        costCurrency: nextCostCurrency,
      });

      return await this.itineraryRepository.updateActivity(updatedActivity);
    } catch (error) {
      rethrowItineraryDomainError(error);
    }
  }
}

function normalizeBudgetCurrency(value: string): string {
  return value.trim().toUpperCase();
}
