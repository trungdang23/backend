import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type ListPublicTripsInput,
  type ListTripsForUserResult,
  type TripRepositoryPort,
} from '../ports/trip-repository.port';

@Injectable()
export class ListPublicTripsService
  implements UseCase<ListPublicTripsInput, ListTripsForUserResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(input: ListPublicTripsInput): Promise<ListTripsForUserResult> {
    return await this.tripRepository.listPublic(input);
  }
}
