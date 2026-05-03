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
import { PlanNode } from '../../domain/plan-node';
import {
  PLAN_NODE_REPOSITORY,
  type PlanNodeRepositoryPort,
} from '../ports/plan-node-repository.port';
import type { TripPlannerResult } from './get-trip-planner.service';

export interface CopyPublicTripPlannerInput {
  sourceTripId: string;
  userId: string;
}

@Injectable()
export class CopyPublicTripPlannerService
  implements UseCase<CopyPublicTripPlannerInput, TripPlannerResult>
{
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
  ) {}

  async execute(
    input: CopyPublicTripPlannerInput,
  ): Promise<TripPlannerResult> {
    const sourceTrip = await this.tripRepository.findById(input.sourceTripId);

    if (sourceTrip === null) {
      throw tripNotFoundException();
    }

    if (!isTripPubliclyReadable(sourceTrip.visibility)) {
      throw permissionDeniedException('Trip is private.');
    }

    const copiedTrip = await this.tripRepository.create({
      userId: input.userId,
      name: sourceTrip.name,
      destination: sourceTrip.destination,
      summaryNotes: sourceTrip.summaryNotes,
      coverImageUrl: sourceTrip.coverImageUrl,
      startDate: sourceTrip.startDate,
      endDate: sourceTrip.endDate,
      timezone: sourceTrip.timezone,
      budgetAmount: sourceTrip.budgetAmount,
      budgetCurrency: sourceTrip.budgetCurrency,
      budgetMode: sourceTrip.budgetMode,
      manualBudgetAmount: sourceTrip.manualBudgetAmount,
      manualBudgetCurrency: sourceTrip.manualBudgetCurrency,
      visibility: 'private',
    });
    const sourceNodes = await this.planNodeRepository.listByTrip({
      tripId: sourceTrip.id,
    });
    const copiedNodes: PlanNode[] = [];
    const copiedNodeIdBySourceId = new Map<string, string>();

    for (const sourceNode of sourceNodes) {
      const copiedNode = await this.planNodeRepository.create(
        PlanNode.create({
          tripId: copiedTrip.id,
          parentId:
            sourceNode.parentId === null
              ? null
              : copiedNodeIdBySourceId.get(sourceNode.parentId) ?? null,
          type: sourceNode.type,
          title: sourceNode.title,
          notes: sourceNode.notes,
          startAt: sourceNode.startAt,
          endAt: sourceNode.endAt,
          costAmount: sourceNode.costAmount,
          costCurrency: sourceNode.costCurrency,
          imageUrl: sourceNode.imageUrl,
          sortOrder: sourceNode.sortOrder,
          depth: sourceNode.depth,
        }),
      );

      copiedNodeIdBySourceId.set(sourceNode.id, copiedNode.id);
      copiedNodes.push(copiedNode);
    }

    return {
      trip: copiedTrip,
      nodes: copiedNodes,
    };
  }
}
