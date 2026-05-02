import { Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import { Trip } from '../../../trips/domain/trip';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { PlanNode } from '../../domain/plan-node';
import {
  PLAN_NODE_REPOSITORY,
  type PlanNodeRepositoryPort,
} from '../ports/plan-node-repository.port';

export interface GetTripPlannerInput {
  userId: string;
  tripId: string;
}

export interface TripPlannerResult {
  trip: Trip;
  nodes: PlanNode[];
}

@Injectable()
export class GetTripPlannerService implements UseCase<
  GetTripPlannerInput,
  TripPlannerResult
> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
  ) {}

  async execute(input: GetTripPlannerInput): Promise<TripPlannerResult> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
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
