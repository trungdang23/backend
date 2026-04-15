import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { Trip } from '../../domain/trip';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../ports/trip-repository.port';

export interface GetTripDetailInput {
  userId: string;
  tripId: string;
}

@Injectable()
export class GetTripDetailService
  implements UseCase<GetTripDetailInput, Trip>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: GetTripDetailInput): Promise<Trip> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    return trip;
  }
}
