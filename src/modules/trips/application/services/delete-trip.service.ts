import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { Trip } from '../../domain/trip';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../ports/trip-repository.port';

export interface DeleteTripInput {
  userId: string;
  tripId: string;
}

@Injectable()
export class DeleteTripService implements UseCase<DeleteTripInput, Trip> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: DeleteTripInput): Promise<Trip> {
    const trip = await this.tripRepository.delete({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    return trip;
  }
}
