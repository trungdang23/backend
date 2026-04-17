import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import type { Trip } from '../../../trips/domain/trip';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import {
  ITINERARY_REPOSITORY,
  type ItineraryDayAggregate,
  type ItineraryRepositoryPort,
} from '../ports/itinerary-repository.port';

export interface GetTripItineraryInput {
  userId: string;
  tripId: string;
}

export interface TripItineraryResult {
  trip: Trip;
  days: ItineraryDayAggregate[];
}

@Injectable()
export class GetTripItineraryService
  implements UseCase<GetTripItineraryInput, TripItineraryResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(ITINERARY_REPOSITORY)
    private readonly itineraryRepository: ItineraryRepositoryPort,
  ) {}

  async execute(input: GetTripItineraryInput): Promise<TripItineraryResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    const days = await this.itineraryRepository.listDayAggregatesByTrip({
      tripId: trip.id,
    });

    return {
      trip,
      days,
    };
  }
}
