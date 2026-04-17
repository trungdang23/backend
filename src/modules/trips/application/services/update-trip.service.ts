import {
  BadRequestException,
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
import { rethrowTripDomainError } from './map-trip-domain-error';

export interface UpdateTripInput {
  userId: string;
  tripId: string;
  name?: string;
  destination?: string | null;
  summaryNotes?: string | null;
  coverImageUrl?: string | null;
  startDate?: string;
  endDate?: string;
  timezone?: string | null;
  budgetAmount?: number;
  budgetCurrency?: string;
}

@Injectable()
export class UpdateTripService implements UseCase<UpdateTripInput, Trip> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: UpdateTripInput): Promise<Trip> {
    if (
      input.name === undefined &&
      input.destination === undefined &&
      input.summaryNotes === undefined &&
      input.coverImageUrl === undefined &&
      input.startDate === undefined &&
      input.endDate === undefined &&
      input.timezone === undefined &&
      input.budgetAmount === undefined &&
      input.budgetCurrency === undefined
    ) {
      throw new BadRequestException(
        'At least one field must be provided to update a trip.',
      );
    }

    const existingTrip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (existingTrip === null) {
      throw new NotFoundException('Trip not found.');
    }

    try {
      const updatedTrip = existingTrip.update({
        name: input.name,
        destination: input.destination,
        summaryNotes: input.summaryNotes,
        coverImageUrl: input.coverImageUrl,
        startDate: input.startDate,
        endDate: input.endDate,
        timezone: input.timezone,
        budgetAmount: input.budgetAmount,
        budgetCurrency: input.budgetCurrency,
      });

      return await this.tripRepository.update(updatedTrip);
    } catch (error) {
      rethrowTripDomainError(error);
    }
  }
}
