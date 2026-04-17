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
import { ItineraryDay } from '../../domain/itinerary-day';
import {
  ITINERARY_REPOSITORY,
  type ItineraryRepositoryPort,
} from '../ports/itinerary-repository.port';
import { rethrowItineraryDomainError } from './map-itinerary-domain-error';

export interface UpdateItineraryDayInput {
  userId: string;
  tripId: string;
  dayId: string;
  date?: string;
  title?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount?: number;
  costCurrency?: string;
  imageUrls?: string[];
}

@Injectable()
export class UpdateItineraryDayService
  implements UseCase<UpdateItineraryDayInput, ItineraryDay>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(ITINERARY_REPOSITORY)
    private readonly itineraryRepository: ItineraryRepositoryPort,
  ) {}

  async execute(input: UpdateItineraryDayInput): Promise<ItineraryDay> {
    if (
      input.date === undefined &&
      input.title === undefined &&
      input.startsAt === undefined &&
      input.endsAt === undefined &&
      input.location === undefined &&
      input.notes === undefined &&
      input.costAmount === undefined &&
      input.costCurrency === undefined &&
      input.imageUrls === undefined
    ) {
      throw new BadRequestException(
        'At least one field must be provided to update an itinerary day.',
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

    const nextCostCurrency = normalizeBudgetCurrency(
      input.costCurrency ?? dayAggregate.day.costCurrency,
    );

    if (nextCostCurrency !== trip.budgetCurrency) {
      throw new BadRequestException(
        'Itinerary day cost currency must match the trip budget currency.',
      );
    }

    try {
      const updatedDay = dayAggregate.day.update({
        date: input.date,
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location,
        notes: input.notes,
        costAmount: input.costAmount,
        costCurrency: nextCostCurrency,
        imageUrls: input.imageUrls,
        tripStartDate: trip.startDate,
        tripEndDate: trip.endDate,
      });

      return await this.itineraryRepository.updateDay(updatedDay);
    } catch (error) {
      rethrowItineraryDomainError(error);
    }
  }
}

function normalizeBudgetCurrency(value: string): string {
  return value.trim().toUpperCase();
}
