import type { PlanNodeStickerRepositoryPort } from '../../src/modules/planning/application/ports/plan-node-sticker-repository.port';
import type { PlanNodeSticker } from '../../src/modules/planning/domain/plan-node-sticker';

export class InMemoryPlanNodeStickerRepository
  implements PlanNodeStickerRepositoryPort
{
  private readonly stickers = new Map<string, PlanNodeSticker>();

  listByNodeId(nodeId: string): Promise<PlanNodeSticker[]> {
    const stickers = Array.from(this.stickers.values())
      .filter((sticker) => sticker.nodeId === nodeId)
      .sort(sortStickers);

    return Promise.resolve(stickers);
  }

  replaceForNode(
    nodeId: string,
    stickers: PlanNodeSticker[],
  ): Promise<PlanNodeSticker[]> {
    for (const sticker of Array.from(this.stickers.values())) {
      if (sticker.nodeId === nodeId) {
        this.stickers.delete(sticker.id);
      }
    }

    for (const sticker of stickers) {
      this.stickers.set(sticker.id, sticker);
    }

    return this.listByNodeId(nodeId);
  }

  clear(): void {
    this.stickers.clear();
  }
}

function sortStickers(left: PlanNodeSticker, right: PlanNodeSticker): number {
  if (left.zIndex !== right.zIndex) {
    return left.zIndex - right.zIndex;
  }

  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return left.createdAt.getTime() - right.createdAt.getTime();
  }

  return left.id.localeCompare(right.id);
}
