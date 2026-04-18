import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { PlanNode } from '../../domain/plan-node';
import {
  PLAN_NODE_REPOSITORY,
  type PlanNodeRepositoryPort,
} from '../ports/plan-node-repository.port';
import { rethrowPlanningDomainError } from './map-planning-domain-error';

export interface CreatePlanNodeInput {
  userId: string;
  tripId: string;
  parentId?: string | null;
  type: string;
  title: string;
  notes?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  costAmount?: number | null;
  costCurrency?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
}

@Injectable()
export class CreatePlanNodeService
  implements UseCase<CreatePlanNodeInput, PlanNode>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
  ) {}

  async execute(input: CreatePlanNodeInput): Promise<PlanNode> {
    const trip = await this.tripRepository.findByIdForUser({
      tripId: input.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw new NotFoundException('Trip not found.');
    }

    let depth = 0;
    let parentId: string | null = null;

    if (input.parentId !== undefined && input.parentId !== null) {
      const parent = await this.planNodeRepository.findById(input.parentId);

      if (parent === null || parent.tripId !== trip.id) {
        throw new NotFoundException('Parent plan node not found.');
      }

      parentId = parent.id;
      depth = parent.depth + 1;
    }

    try {
      const node = PlanNode.create({
        tripId: trip.id,
        parentId,
        type: input.type,
        title: input.title,
        notes: input.notes,
        startAt: input.startAt,
        endAt: input.endAt,
        costAmount: input.costAmount,
        costCurrency: input.costCurrency,
        imageUrl: input.imageUrl,
        sortOrder: input.sortOrder,
        depth,
      });

      return await this.planNodeRepository.create(node);
    } catch (error) {
      rethrowPlanningDomainError(error);
    }
  }
}
