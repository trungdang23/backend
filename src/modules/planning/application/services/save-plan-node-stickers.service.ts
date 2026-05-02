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
import {
  MAX_PLAN_NODE_STICKERS,
  PlanNodeSticker,
} from '../../domain/plan-node-sticker';
import {
  PLAN_NODE_REPOSITORY,
  type PlanNodeRepositoryPort,
} from '../ports/plan-node-repository.port';
import {
  PLAN_NODE_STICKER_REPOSITORY,
  type PlanNodeStickerRepositoryPort,
} from '../ports/plan-node-sticker-repository.port';
import { rethrowPlanningDomainError } from './map-planning-domain-error';

export interface SavePlanNodeStickerInput {
  id?: string;
  stickerKey: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  zIndex?: number;
}

export interface SavePlanNodeStickersInput {
  userId: string;
  nodeId: string;
  stickers: SavePlanNodeStickerInput[];
}

@Injectable()
export class SavePlanNodeStickersService implements UseCase<
  SavePlanNodeStickersInput,
  PlanNodeSticker[]
> {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(PLAN_NODE_REPOSITORY)
    private readonly planNodeRepository: PlanNodeRepositoryPort,
    @Inject(PLAN_NODE_STICKER_REPOSITORY)
    private readonly planNodeStickerRepository: PlanNodeStickerRepositoryPort,
  ) {}

  async execute(input: SavePlanNodeStickersInput): Promise<PlanNodeSticker[]> {
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

    if (input.stickers.length > MAX_PLAN_NODE_STICKERS) {
      throw nodeValidationException(
        `A plan node can have at most ${MAX_PLAN_NODE_STICKERS} stickers.`,
      );
    }

    try {
      const stickers = input.stickers.map((sticker) =>
        PlanNodeSticker.create({
          id: sticker.id,
          nodeId: node.id,
          stickerKey: sticker.stickerKey,
          x: sticker.x,
          y: sticker.y,
          rotation: sticker.rotation,
          scale: sticker.scale,
          zIndex: sticker.zIndex,
        }),
      );

      return await this.planNodeStickerRepository.replaceForNode(
        node.id,
        stickers,
      );
    } catch (error) {
      rethrowPlanningDomainError(error);
    }
  }
}
