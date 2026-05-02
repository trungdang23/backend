import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  nodeValidationException,
  tripNotFoundException,
} from '../../../../app/errors/app-exceptions';
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
import { validateActivitySchedule } from './validate-activity-schedule';

export interface UpdatePlanNodeInput {
  userId: string;
  nodeId: string;
  type?: string;
  title?: string;
  notes?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  costAmount?: number | null;
  costCurrency?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}

@Injectable()
export class UpdatePlanNodeService implements UseCase<
  UpdatePlanNodeInput,
  PlanNode
> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
  ) {}

  async execute(input: UpdatePlanNodeInput): Promise<PlanNode> {
    const node = await this.planNodeRepository.findById(input.nodeId);

    if (node === null) {
      throw new NotFoundException('Plan node not found.');
    }

    const trip = await this.tripRepository.findByIdForUser({
      tripId: node.tripId,
      userId: input.userId,
    });

    if (trip === null) {
      throw tripNotFoundException();
    }

    if (!hasAnyDefinedValue(input)) {
      throw nodeValidationException(
        'At least one field must be provided to update a plan node.',
      );
    }

    try {
      const updatedNode = node.update({
        type: input.type,
        title: input.title,
        notes: input.notes,
        startAt: input.startAt,
        endAt: input.endAt,
        costAmount: input.costAmount,
        costCurrency: input.costCurrency,
        imageUrl: input.imageUrl,
        sortOrder: input.sortOrder,
      });

      if (updatedNode.type === 'activity') {
        const existingNodes = await this.planNodeRepository.listByTrip({
          tripId: trip.id,
        });

        validateActivitySchedule({
          trip,
          node: updatedNode,
          existingNodes,
        });
      }

      return await this.planNodeRepository.update(updatedNode);
    } catch (error) {
      rethrowPlanningDomainError(error);
    }
  }
}

function hasAnyDefinedValue(input: UpdatePlanNodeInput): boolean {
  return [
    input.type,
    input.title,
    input.notes,
    input.startAt,
    input.endAt,
    input.costAmount,
    input.costCurrency,
    input.imageUrl,
    input.sortOrder,
  ].some((value) => value !== undefined);
}
