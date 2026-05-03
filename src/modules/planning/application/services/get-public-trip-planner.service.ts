import { Inject, Injectable } from '@nestjs/common';

import {
  permissionDeniedException,
  tripNotFoundException,
} from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { isTripPubliclyReadable } from '../../../trips/domain/trip-visibility';
import {
  PLAN_NODE_REPOSITORY,
  type PlanNodeRepositoryPort,
} from '../ports/plan-node-repository.port';
import type { TripPlannerResult } from './get-trip-planner.service';

@Injectable()
export class GetPublicTripPlannerService implements UseCase<
  string,
  TripPlannerResult
> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
  ) {}

  async execute(tripId: string): Promise<TripPlannerResult> {
    const trip = await this.tripRepository.findById(tripId);

    if (trip === null) {
      throw tripNotFoundException();
    }

    if (!isTripPubliclyReadable(trip.visibility)) {
      throw permissionDeniedException('Trip is private.');
    }

    const nodes = await this.planNodeRepository.listByTrip({
      tripId: trip.id,
    });

    return {
      trip,
      nodes,
    };
  }
}
