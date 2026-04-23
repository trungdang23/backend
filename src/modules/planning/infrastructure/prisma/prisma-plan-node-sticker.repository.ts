import { Injectable } from '@nestjs/common';
import type { PlanNodeSticker as PrismaPlanNodeSticker } from '@prisma/client';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PlanNodeSticker } from '../../domain/plan-node-sticker';
import type { PlanNodeStickerRepositoryPort } from '../../application/ports/plan-node-sticker-repository.port';

@Injectable()
export class PrismaPlanNodeStickerRepository
  implements PlanNodeStickerRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async listByNodeId(nodeId: string): Promise<PlanNodeSticker[]> {
    const records = await this.prisma.planNodeSticker.findMany({
      where: {
        nodeId,
      },
      orderBy: [{ zIndex: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });

    return records.map((record) => toPlanNodeSticker(record));
  }

  async replaceForNode(
    nodeId: string,
    stickers: PlanNodeSticker[],
  ): Promise<PlanNodeSticker[]> {
    const records = await this.prisma.$transaction(async (transaction) => {
      await transaction.planNodeSticker.deleteMany({
        where: {
          nodeId,
        },
      });

      if (stickers.length > 0) {
        await transaction.planNodeSticker.createMany({
          data: stickers.map((sticker) => toPlanNodeStickerCreateInput(sticker)),
        });
      }

      return transaction.planNodeSticker.findMany({
        where: {
          nodeId,
        },
        orderBy: [{ zIndex: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
    });

    return records.map((record) => toPlanNodeSticker(record));
  }
}

function toPlanNodeSticker(record: PrismaPlanNodeSticker): PlanNodeSticker {
  return PlanNodeSticker.create({
    id: record.id,
    nodeId: record.nodeId,
    stickerKey: record.stickerKey,
    x: record.x,
    y: record.y,
    rotation: record.rotation,
    scale: record.scale,
    zIndex: record.zIndex,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function toPlanNodeStickerCreateInput(sticker: PlanNodeSticker) {
  return {
    id: sticker.id,
    nodeId: sticker.nodeId,
    stickerKey: sticker.stickerKey,
    x: sticker.x,
    y: sticker.y,
    rotation: sticker.rotation,
    scale: sticker.scale,
    zIndex: sticker.zIndex,
    createdAt: sticker.createdAt,
    updatedAt: sticker.updatedAt,
  };
}
