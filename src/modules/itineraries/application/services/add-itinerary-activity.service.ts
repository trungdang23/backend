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

export interface AddItineraryActivityInput {
  userId: string;
  tripId: string;
  dayId: string;
  title: string;
  startsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount?: number;
  costCurrency?: string;
}

@Injectable()
export class AddItineraryActivityService
  implements UseCase<AddItineraryActivityInput, ItineraryActivity>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(ITINERARY_REPOSITORY)
    private readonly itineraryRepository: ItineraryRepositoryPort,
  ) {}

  async execute(
    input: AddItineraryActivityInput,
  ): Promise<ItineraryActivity> {
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

    const costCurrency = normalizeBudgetCurrency(
      input.costCurrency ?? trip.budgetCurrency,
    );

    if (costCurrency !== trip.budgetCurrency) {
      throw new BadRequestException(
        'Activity cost currency must match the trip budget currency.',
      );
    }

    try {
      const activity = ItineraryActivity.create({
        itineraryDayId: dayAggregate.day.id,
        title: input.title,
        startsAt: input.startsAt,
        location: input.location,
        notes: input.notes,
        costAmount: input.costAmount ?? 0,
        costCurrency,
        position: dayAggregate.activities.length + 1,
      });

      return await this.itineraryRepository.createActivity({
        itineraryDayId: activity.itineraryDayId,
        title: activity.title,
        startsAt: activity.startsAt,
        location: activity.location,
        notes: activity.notes,
        costAmount: activity.costAmount,
        costCurrency: activity.costCurrency,
        position: activity.position,
      });
    } catch (error) {
      rethrowItineraryDomainError(error);
    }
  }
}

function normalizeBudgetCurrency(value: string): string {
  return value.trim().toUpperCase();
}
