import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type ListTripsForUserInput,
  type ListTripsForUserResult,
  type TripRepositoryPort,
} from '../ports/trip-repository.port';

@Injectable()
export class ListTripsService
  implements UseCase<ListTripsForUserInput, ListTripsForUserResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: ListTripsForUserInput): Promise<ListTripsForUserResult> {
    return await this.tripRepository.listByUser(input);
  }
}
