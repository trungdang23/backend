import {
  ConflictException,
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

    try {
      const itineraryDay = ItineraryDay.create({
        tripId: trip.id,
        date: input.date,
        tripStartDate: trip.startDate,
        tripEndDate: trip.endDate,
      });

      const existingDay =
        await this.itineraryRepository.findDayByDateForTrip({
          tripId: trip.id,
          date: itineraryDay.date,
        });

      if (existingDay !== null) {
        throw new ConflictException(
          'Itinerary day already exists for this trip date.',
        );
      }

      return await this.itineraryRepository.createDay({
        tripId: trip.id,
        date: itineraryDay.date,
      });
    } catch (error) {
      rethrowItineraryDomainError(error);
    }
  }
}
