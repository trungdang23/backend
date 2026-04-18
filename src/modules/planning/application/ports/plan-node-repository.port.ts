import type { PlanNode } from '../../domain/plan-node';

export const PLAN_NODE_REPOSITORY = Symbol('PLAN_NODE_REPOSITORY');

export interface ListPlanNodesByTripInput {
  tripId: string;
}

export interface PlanNodeRepositoryPort {
  create(node: PlanNode): Promise<PlanNode>;
  findById(nodeId: string): Promise<PlanNode | null>;
  listByTrip(input: ListPlanNodesByTripInput): Promise<PlanNode[]>;
  update(node: PlanNode): Promise<PlanNode>;
  delete(nodeId: string): Promise<void>;
}
