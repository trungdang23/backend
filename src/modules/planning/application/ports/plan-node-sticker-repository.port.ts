import type { PlanNodeSticker } from '../../domain/plan-node-sticker';

export const PLAN_NODE_STICKER_REPOSITORY = Symbol(
  'PLAN_NODE_STICKER_REPOSITORY',
);

export interface PlanNodeStickerRepositoryPort {
  listByNodeId(nodeId: string): Promise<PlanNodeSticker[]>;
  replaceForNode(
    nodeId: string,
    stickers: PlanNodeSticker[],
  ): Promise<PlanNodeSticker[]>;
}
