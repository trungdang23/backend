import { Injectable } from '@nestjs/common';
import type { PlanNode as PrismaPlanNode } from '@prisma/client';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PlanNode } from '../../domain/plan-node';
import type {
  ListPlanNodesByTripInput,
  PlanNodeRepositoryPort,
} from '../../application/ports/plan-node-repository.port';

@Injectable()
export class PrismaPlanNodeRepository implements PlanNodeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(node: PlanNode): Promise<PlanNode> {
    const record = await this.prisma.planNode.create({
      data: toPlanNodeCreateInput(node),
    });

    return toPlanNode(record);
  }

  async findById(nodeId: string): Promise<PlanNode | null> {
    const record = await this.prisma.planNode.findUnique({
      where: {
        id: nodeId,
      },
    });

    return record === null ? null : toPlanNode(record);
  }

  async listByTrip(input: ListPlanNodesByTripInput): Promise<PlanNode[]> {
    const records = await this.prisma.planNode.findMany({
      where: {
        tripId: input.tripId,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });

    return sortPlanNodesForTree(records.map((record) => toPlanNode(record)));
  }

  async update(node: PlanNode): Promise<PlanNode> {
    const record = await this.prisma.planNode.update({
      where: {
        id: node.id,
      },
      data: {
        type: node.type,
        title: node.title,
        notes: node.notes,
        startAt: node.startAt,
        endAt: node.endAt,
        costAmount: node.costAmount,
        costCurrency: node.costCurrency,
        imageUrl: node.imageUrl,
        sortOrder: node.sortOrder,
        updatedAt: node.updatedAt,
      },
    });

    return toPlanNode(record);
  }

  async delete(nodeId: string): Promise<void> {
    await this.prisma.planNode.delete({
      where: {
        id: nodeId,
      },
    });
  }
}

function toPlanNode(record: PrismaPlanNode): PlanNode {
  return PlanNode.create({
    id: record.id,
    tripId: record.tripId,
    parentId: record.parentId,
    type: record.type,
    title: record.title,
    notes: record.notes,
    startAt: record.startAt,
    endAt: record.endAt,
    costAmount: record.costAmount,
    costCurrency: record.costCurrency,
    imageUrl: record.imageUrl,
    sortOrder: record.sortOrder,
    depth: record.depth,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function toPlanNodeCreateInput(node: PlanNode) {
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

function sortPlanNodesForTree(nodes: PlanNode[]): PlanNode[] {
  const nodesByParentId = new Map<string | null, PlanNode[]>();

  for (const node of nodes) {
    const siblings = nodesByParentId.get(node.parentId) ?? [];
    siblings.push(node);
    nodesByParentId.set(node.parentId, siblings);
  }

  for (const siblings of nodesByParentId.values()) {
    siblings.sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      if (left.createdAt.getTime() !== right.createdAt.getTime()) {
        return left.createdAt.getTime() - right.createdAt.getTime();
      }

      return left.id.localeCompare(right.id);
    });
  }

  const orderedNodes: PlanNode[] = [];

  function appendChildren(parentId: string | null) {
    for (const node of nodesByParentId.get(parentId) ?? []) {
      orderedNodes.push(node);
      appendChildren(node.id);
    }
  }

  appendChildren(null);

  return orderedNodes;
}
