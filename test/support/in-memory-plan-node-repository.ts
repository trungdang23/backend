import type {
  ListPlanNodesByTripInput,
  PlanNodeRepositoryPort,
} from '../../src/modules/planning/application/ports/plan-node-repository.port';
import type { PlanNode } from '../../src/modules/planning/domain/plan-node';

export class InMemoryPlanNodeRepository implements PlanNodeRepositoryPort {
  private readonly nodes = new Map<string, PlanNode>();

  create(node: PlanNode): Promise<PlanNode> {
    this.nodes.set(node.id, node);
    return Promise.resolve(node);
  }

  findById(nodeId: string): Promise<PlanNode | null> {
    return Promise.resolve(this.nodes.get(nodeId) ?? null);
  }

  listByTrip(input: ListPlanNodesByTripInput): Promise<PlanNode[]> {
    const nodes = Array.from(this.nodes.values()).filter(
      (node) => node.tripId === input.tripId,
    );

    return Promise.resolve(sortPlanNodesForTree(nodes));
  }

  update(node: PlanNode): Promise<PlanNode> {
    this.nodes.set(node.id, node);
    return Promise.resolve(node);
  }

  delete(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);

    if (!node) {
      return Promise.resolve();
    }

    const childIds = Array.from(this.nodes.values())
      .filter((currentNode) => currentNode.parentId === node.id)
      .map((currentNode) => currentNode.id);

    this.nodes.delete(node.id);

    return Promise.all(childIds.map((childId) => this.delete(childId))).then(
      () => undefined,
    );
  }

  clear(): void {
    this.nodes.clear();
  }
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
