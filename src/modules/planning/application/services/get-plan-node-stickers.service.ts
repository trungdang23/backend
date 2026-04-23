import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import type { PlanNodeSticker } from '../../domain/plan-node-sticker';
import {
  PLAN_NODE_REPOSITORY,
  type PlanNodeRepositoryPort,
} from '../ports/plan-node-repository.port';
import {
  PLAN_NODE_STICKER_REPOSITORY,
  type PlanNodeStickerRepositoryPort,
} from '../ports/plan-node-sticker-repository.port';

export interface GetPlanNodeStickersInput {
  userId: string;
  nodeId: string;
}

@Injectable()
export class GetPlanNodeStickersService
  implements UseCase<GetPlanNodeStickersInput, PlanNodeSticker[]>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
    @Inject(PLAN_NODE_STICKER_REPOSITORY)
    private readonly planNodeStickerRepository: PlanNodeStickerRepositoryPort,
  ) {}

  async execute(input: GetPlanNodeStickersInput): Promise<PlanNodeSticker[]> {
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

    return this.planNodeStickerRepository.listByNodeId(node.id);
  }
}
