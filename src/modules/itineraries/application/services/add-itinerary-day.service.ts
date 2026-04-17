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

export interface AddItineraryDayInput {
  userId: string;
  tripId: string;
  date: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount?: number;
  costCurrency?: string;
  imageUrls?: string[];
}

@Injectable()
export class AddItineraryDayService
  implements UseCase<AddItineraryDayInput, ItineraryDay>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(ITINERARY_REPOSITORY)
    private readonly itineraryRepository: ItineraryRepositoryPort,
  ) {}

  async execute(input: AddItineraryDayInput): Promise<ItineraryDay> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    const costCurrency = normalizeBudgetCurrency(
      input.costCurrency ?? trip.budgetCurrency,
    );

    if (costCurrency !== trip.budgetCurrency) {
      throw new BadRequestException(
        'Itinerary day cost currency must match the trip budget currency.',
      );
    }

    try {
      const position = await this.itineraryRepository.findNextDayPositionForDate({
        tripId: trip.id,
        date: input.date,
      });

      const itineraryDay = ItineraryDay.create({
        tripId: trip.id,
        date: input.date,
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location,
        notes: input.notes,
        costAmount: input.costAmount ?? 0,
        costCurrency,
        position,
        imageUrls: input.imageUrls,
        tripStartDate: trip.startDate,
        tripEndDate: trip.endDate,
      });

      return await this.itineraryRepository.createDay({
        tripId: trip.id,
        date: itineraryDay.date,
        title: itineraryDay.title,
        startsAt: itineraryDay.startsAt,
        endsAt: itineraryDay.endsAt,
        location: itineraryDay.location,
        notes: itineraryDay.notes,
        costAmount: itineraryDay.costAmount,
        costCurrency: itineraryDay.costCurrency,
        position: itineraryDay.position,
        imageUrls: itineraryDay.imageUrls,
      });
    } catch (error) {
      rethrowItineraryDomainError(error);
    }
  }
}

function normalizeBudgetCurrency(value: string): string {
  return value.trim().toUpperCase();
}
