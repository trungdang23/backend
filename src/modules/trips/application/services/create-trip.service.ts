import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { Trip } from '../../domain/trip';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../ports/trip-repository.port';
import { rethrowTripDomainError } from './map-trip-domain-error';

export interface CreateTripInput {
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  timezone: string;
  budgetAmount: number;
  budgetCurrency: string;
}

@Injectable()
export class CreateTripService implements UseCase<CreateTripInput, Trip> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: CreateTripInput): Promise<Trip> {
    try {
      const trip = Trip.create(input);

      return await this.tripRepository.create({
        userId: trip.userId,
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        timezone: trip.timezone,
        budgetAmount: trip.budgetAmount,
        budgetCurrency: trip.budgetCurrency,
      });
    } catch (error) {
      rethrowTripDomainError(error);
    }
  }
}
