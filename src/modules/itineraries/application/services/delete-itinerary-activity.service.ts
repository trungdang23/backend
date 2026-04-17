import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import {
  ITINERARY_REPOSITORY,
  type ItineraryRepositoryPort,
} from '../ports/itinerary-repository.port';

export interface DeleteItineraryActivityInput {
  userId: string;
  tripId: string;
  dayId: string;
  activityId: string;
}

@Injectable()
export class DeleteItineraryActivityService
  implements UseCase<DeleteItineraryActivityInput, void>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(ITINERARY_REPOSITORY)
    private readonly itineraryRepository: ItineraryRepositoryPort,
  ) {}

  async execute(input: DeleteItineraryActivityInput): Promise<void> {
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

    const activity = dayAggregate.activities.find(
      (candidate) => candidate.id === input.activityId,
    );

    if (activity === undefined) {
      throw new NotFoundException('Itinerary activity not found.');
    }

    await this.itineraryRepository.deleteActivity(activity.id);
  }
}
