import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { Trip } from '../../domain/trip';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../ports/trip-repository.port';

@Injectable()
export class GetPublicTripDetailService implements UseCase<string, Trip> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(tripId: string): Promise<Trip> {
    const trip = await this.tripRepository.findById(tripId);

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    if (trip.visibility !== 'public') {
      throw new ForbiddenException('Trip is private.');
    }

    return trip;
  }
}
