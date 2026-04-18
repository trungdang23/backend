import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import {
  PLAN_NODE_REPOSITORY,
  type PlanNodeRepositoryPort,
} from '../ports/plan-node-repository.port';

export interface DeletePlanNodeInput {
  userId: string;
  nodeId: string;
}

@Injectable()
export class DeletePlanNodeService
  implements UseCase<DeletePlanNodeInput, void>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
  ) {}

  async execute(input: DeletePlanNodeInput): Promise<void> {
    const node = await this.planNodeRepository.findById(input.nodeId);

    if (node === null) {
      throw new NotFoundException('Plan node not found.');
    }

    const trip = await this.tripRepository.findByIdForUser({
      tripId: node.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    await this.planNodeRepository.delete(node.id);
  }
}
