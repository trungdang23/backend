import type { ItineraryActivity } from '../../../itineraries/domain/itinerary-activity';
import type { ItineraryDay } from '../../../itineraries/domain/itinerary-day';
import type { ItineraryDayAggregate } from '../../../itineraries/application/ports/itinerary-repository.port';
import { PlanNode } from '../../domain/plan-node';

export const LEGACY_ITINERARY_DAY_NODE_ID_PREFIX = 'itinerary-day-';
export const LEGACY_ITINERARY_DAY_LOCATION_NODE_ID_PREFIX =
  'itinerary-day-location-';
export const LEGACY_ITINERARY_DAY_COST_NODE_ID_PREFIX = 'itinerary-day-cost-';
export const LEGACY_ITINERARY_ACTIVITY_NODE_ID_PREFIX = 'itinerary-activity-';

export type LegacyItineraryMigrationWarningCode =
  | 'LEGACY_ITINERARY_DAY_EXTRA_IMAGES_DROPPED'
  | 'LEGACY_ITINERARY_ACTIVITY_EXTRA_IMAGES_DROPPED';

export interface LegacyItineraryPlanNodeMigrationWarning {
  code: LegacyItineraryMigrationWarningCode;
  sourceType: 'day' | 'activity';
  sourceId: string;
  tripId: string;
  droppedImageCount: number;
  message: string;
}

export interface LegacyItineraryPlanNodeMigrationSummary {
  dayNodeCount: number;
  locationNodeCount: number;
  activityNodeCount: number;
  costNoteNodeCount: number;
  costBearingNodeCount: number;
}

export interface BuildPlanNodesFromLegacyItineraryInput {
  tripId: string;
  dayAggregates: ItineraryDayAggregate[];
}

export interface BuildPlanNodesFromLegacyItineraryResult {
  nodes: PlanNode[];
  warnings: LegacyItineraryPlanNodeMigrationWarning[];
  summary: LegacyItineraryPlanNodeMigrationSummary;
}

export function buildPlanNodesFromLegacyItinerary(
  input: BuildPlanNodesFromLegacyItineraryInput,
): BuildPlanNodesFromLegacyItineraryResult {
  const tripId = input.tripId.trim();
  const orderedAggregates = [...input.dayAggregates].sort(
    compareItineraryDayAggregates,
  );
  const nodes: PlanNode[] = [];
  const warnings: LegacyItineraryPlanNodeMigrationWarning[] = [];
  const summary: LegacyItineraryPlanNodeMigrationSummary = {
    dayNodeCount: 0,
    locationNodeCount: 0,
    activityNodeCount: 0,
    costNoteNodeCount: 0,
    costBearingNodeCount: 0,
  };

  for (const [dayIndex, aggregate] of orderedAggregates.entries()) {
    const dayNodeId = `${LEGACY_ITINERARY_DAY_NODE_ID_PREFIX}${aggregate.day.id}`;
    const dayImage = resolvePrimaryImage({
      tripId,
      sourceType: 'day',
      sourceId: aggregate.day.id,
      imageUrls: aggregate.day.imageUrls,
      warnings,
    });
    const dayNode = PlanNode.create({
      id: dayNodeId,
      tripId,
      parentId: null,
      type: 'day',
      title: aggregate.day.title,
      notes: aggregate.day.notes,
      startAt: combineDateAndTime(aggregate.day.date, aggregate.day.startsAt),
      endAt: combineDateAndTime(aggregate.day.date, aggregate.day.endsAt),
      costAmount: null,
      costCurrency: null,
      imageUrl: dayImage,
      sortOrder: dayIndex,
      depth: 0,
      createdAt: aggregate.day.createdAt,
      updatedAt: aggregate.day.updatedAt,
    });
    nodes.push(dayNode);
    summary.dayNodeCount += 1;

    let nextChildSortOrder = 0;

    if (aggregate.day.location !== null) {
      nodes.push(
        PlanNode.create({
          id: `${LEGACY_ITINERARY_DAY_LOCATION_NODE_ID_PREFIX}${aggregate.day.id}`,
          tripId,
          parentId: dayNode.id,
          type: 'location',
          title: aggregate.day.location,
          notes: null,
          startAt: null,
          endAt: null,
          costAmount: null,
          costCurrency: null,
          imageUrl: null,
          sortOrder: nextChildSortOrder,
          depth: 1,
          createdAt: aggregate.day.createdAt,
          updatedAt: aggregate.day.updatedAt,
        }),
      );
      nextChildSortOrder += 1;
      summary.locationNodeCount += 1;
    }

    const orderedActivities = [...aggregate.activities].sort(compareActivities);
    for (const activity of orderedActivities) {
      const activityImage = resolvePrimaryImage({
        tripId,
        sourceType: 'activity',
        sourceId: activity.id,
        imageUrls: activity.imageUrls,
        warnings,
      });
      const activityCost = normalizeLegacyCost(
        activity.costAmount,
        activity.costCurrency,
      );

      nodes.push(
        PlanNode.create({
          id: `${LEGACY_ITINERARY_ACTIVITY_NODE_ID_PREFIX}${activity.id}`,
          tripId,
          parentId: dayNode.id,
          type: 'activity',
          title: activity.title,
          notes: buildActivityNotes(activity),
          startAt: combineDateAndTime(aggregate.day.date, activity.startsAt),
          endAt: combineDateAndTime(aggregate.day.date, activity.endsAt),
          costAmount: activityCost.amount,
          costCurrency: activityCost.currency,
          imageUrl: activityImage,
          sortOrder: nextChildSortOrder,
          depth: 1,
          createdAt: activity.createdAt,
          updatedAt: activity.updatedAt,
        }),
      );
      nextChildSortOrder += 1;
      summary.activityNodeCount += 1;

      if (activityCost.amount !== null) {
        summary.costBearingNodeCount += 1;
      }
    }

    const dayCost = normalizeLegacyCost(
      aggregate.day.costAmount,
      aggregate.day.costCurrency,
    );

    if (dayCost.amount !== null) {
      nodes.push(
        PlanNode.create({
          id: `${LEGACY_ITINERARY_DAY_COST_NODE_ID_PREFIX}${aggregate.day.id}`,
          tripId,
          parentId: dayNode.id,
          type: 'note',
          title: 'Chi phí ngày',
          notes: null,
          startAt: null,
          endAt: null,
          costAmount: dayCost.amount,
          costCurrency: dayCost.currency,
          imageUrl: null,
          sortOrder: nextChildSortOrder,
          depth: 1,
          createdAt: aggregate.day.createdAt,
          updatedAt: aggregate.day.updatedAt,
        }),
      );
      summary.costNoteNodeCount += 1;
      summary.costBearingNodeCount += 1;
    }
  }

  return {
    nodes,
    warnings,
    summary,
  };
}

function compareItineraryDayAggregates(
  left: ItineraryDayAggregate,
  right: ItineraryDayAggregate,
): number {
  return compareDays(left.day, right.day);
}

function compareDays(left: ItineraryDay, right: ItineraryDay): number {
  if (left.date !== right.date) {
    return left.date.localeCompare(right.date);
  }

  if (left.position !== right.position) {
    return left.position - right.position;
  }

  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return left.createdAt.getTime() - right.createdAt.getTime();
  }

  return left.id.localeCompare(right.id);
}

function compareActivities(
  left: ItineraryActivity,
  right: ItineraryActivity,
): number {
  if (left.position !== right.position) {
    return left.position - right.position;
  }

  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return left.createdAt.getTime() - right.createdAt.getTime();
  }

  return left.id.localeCompare(right.id);
}

function combineDateAndTime(date: string, time: string | null): string | null {
  if (time === null) {
    return null;
  }

  return `${date}T${time}`;
}

function normalizeLegacyCost(amount: number, currency: string) {
  if (amount <= 0) {
    return {
      amount: null,
      currency: null,
    };
  }

  return {
    amount,
    currency,
  };
}

function resolvePrimaryImage(input: {
  tripId: string;
  sourceType: 'day' | 'activity';
  sourceId: string;
  imageUrls: string[];
  warnings: LegacyItineraryPlanNodeMigrationWarning[];
}): string | null {
  if (input.imageUrls.length === 0) {
    return null;
  }

  if (input.imageUrls.length > 1) {
    input.warnings.push({
      code:
        input.sourceType === 'day'
          ? 'LEGACY_ITINERARY_DAY_EXTRA_IMAGES_DROPPED'
          : 'LEGACY_ITINERARY_ACTIVITY_EXTRA_IMAGES_DROPPED',
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      tripId: input.tripId,
      droppedImageCount: input.imageUrls.length - 1,
      message: `${input.sourceType} ${input.sourceId} has ${
        input.imageUrls.length - 1
      } extra image(s) beyond PlanNode.imageUrl capacity.`,
    });
  }

  return input.imageUrls[0];
}

function buildActivityNotes(activity: ItineraryActivity): string | null {
  if (activity.location === null) {
    return activity.notes;
  }

  if (activity.notes === null) {
    return `Địa điểm: ${activity.location}`;
  }

  return `Địa điểm: ${activity.location}\n\n${activity.notes}`;
}
