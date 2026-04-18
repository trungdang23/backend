import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PLAN_NODE_TYPES, PlanNode } from '../../domain/plan-node';

export class PlanNodeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tripId!: string;

  @ApiPropertyOptional({ nullable: true })
  parentId!: string | null;

  @ApiProperty({ enum: PLAN_NODE_TYPES })
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  startAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  endAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  costAmount!: number | null;

  @ApiPropertyOptional({ nullable: true })
  costCurrency!: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  depth!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(node: PlanNode): PlanNodeResponseDto {
    return {
      id: node.id,
      tripId: node.tripId,
      parentId: node.parentId,
      type: node.type,
      title: node.title,
      notes: node.notes,
      startAt: node.startAt,
      endAt: node.endAt,
      costAmount: node.costAmount,
      costCurrency: node.costCurrency,
      imageUrl: node.imageUrl,
      sortOrder: node.sortOrder,
      depth: node.depth,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };
  }
}
