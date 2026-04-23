import { ApiProperty } from '@nestjs/swagger';

import { PlanNodeSticker } from '../../domain/plan-node-sticker';

export class PlanNodeStickerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nodeId!: string;

  @ApiProperty()
  stickerKey!: string;

  @ApiProperty()
  x!: number;

  @ApiProperty()
  y!: number;

  @ApiProperty()
  rotation!: number;

  @ApiProperty()
  scale!: number;

  @ApiProperty()
  zIndex!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(sticker: PlanNodeSticker): PlanNodeStickerResponseDto {
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
}
