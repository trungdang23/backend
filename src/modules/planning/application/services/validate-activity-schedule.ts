import { nodeValidationException } from '../../../../app/errors/app-exceptions';
import type { Trip } from '../../../trips/domain/trip';
import type { PlanNode } from '../../domain/plan-node';

const ISO_DATE_TIME_PARTS_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:Z|[+-]\d{2}:\d{2})?$/;

interface ValidateActivityScheduleInput {
  trip: Trip;
  node: PlanNode;
  existingNodes: PlanNode[];
}

interface ActivityTimeRange {
  startAt: number;
  endAt: number;
  startDate: string;
  endDate: string;
}

export function validateActivitySchedule(
  input: ValidateActivityScheduleInput,
): void {
  if (input.node.type !== 'activity') {
    return;
  }

  const activityRange = getActivityTimeRange(input.node);

  if (
    !isDateWithinTrip(input.trip, activityRange.startDate) ||
    !isDateWithinTrip(input.trip, activityRange.endDate)
  ) {
    throw nodeValidationException(
      'Activity time must be within the trip date range.',
    );
  }

  const hasOverlap = input.existingNodes.some((existingNode) => {
    if (existingNode.id === input.node.id || existingNode.type !== 'activity') {
      return false;
    }

    if (existingNode.startAt === null || existingNode.endAt === null) {
      return false;
    }

    const existingRange = getActivityTimeRange(existingNode);

    return rangesOverlap(activityRange, existingRange);
  });

  if (hasOverlap) {
    throw nodeValidationException(
      'Activity time overlaps another activity in this trip.',
    );
  }
}

function getActivityTimeRange(node: PlanNode): ActivityTimeRange {
  if (node.startAt === null || node.endAt === null) {
    throw nodeValidationException('Activity start and end times are required.');
  }

  const startAt = parseDateTimeForPlanner(node.startAt, 'Activity start time');
  const endAt = parseDateTimeForPlanner(node.endAt, 'Activity end time');

  if (endAt <= startAt) {
    throw nodeValidationException(
      'Activity end time must be after start time.',
    );
  }

  return {
    startAt,
    endAt,
    startDate: getDatePortion(node.startAt),
    endDate: getDatePortion(node.endAt),
  };
}

function parseDateTimeForPlanner(value: string, label: string): number {
  const match = ISO_DATE_TIME_PARTS_REGEX.exec(value);

  if (match === null) {
    throw nodeValidationException(
      `${label} must be a valid ISO date-time string.`,
    );
  }

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const secondValue = match[6] ?? '0';
  const millisecondValue = match[7] ?? '0';
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const millisecond = Number(millisecondValue);
  const timestamp = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  const normalizedDate = new Date(timestamp);

  if (
    normalizedDate.getUTCFullYear() !== year ||
    normalizedDate.getUTCMonth() !== month - 1 ||
    normalizedDate.getUTCDate() !== day ||
    normalizedDate.getUTCHours() !== hour ||
    normalizedDate.getUTCMinutes() !== minute ||
    normalizedDate.getUTCSeconds() !== second ||
    normalizedDate.getUTCMilliseconds() !== millisecond
  ) {
    throw nodeValidationException(
      `${label} must be a valid ISO date-time string.`,
    );
  }

  return timestamp;
}

function getDatePortion(value: string): string {
  return value.slice(0, 10);
}

function isDateWithinTrip(trip: Trip, date: string): boolean {
  return date >= trip.startDate && date <= trip.endDate;
}

function rangesOverlap(
  left: ActivityTimeRange,
  right: ActivityTimeRange,
): boolean {
  return left.startAt < right.endAt && right.startAt < left.endAt;
}
