import { BadRequestException } from '@nestjs/common';

import {
  DEFAULT_TRIP_SORT,
  TRIP_SORT_FIELDS,
  type TripSort,
  type TripSortDirection,
  type TripSortField,
} from '../application/trip-sort';

export function parseTripSort(sortValue?: string): TripSort {
  if (sortValue === undefined || sortValue.trim().length === 0) {
    return DEFAULT_TRIP_SORT;
  }

  const [field, direction, ...rest] = sortValue.trim().split(',');

  if (rest.length > 0) {
    throw new BadRequestException(
      'Sort must follow the format "<field>,<direction>".',
    );
  }

  if (!TRIP_SORT_FIELDS.includes(field as TripSortField)) {
    throw new BadRequestException('Trip sort field is not supported.');
  }

  if (direction !== 'asc' && direction !== 'desc') {
    throw new BadRequestException('Trip sort direction must be asc or desc.');
  }

  return {
    field: field as TripSortField,
    direction: direction as TripSortDirection,
  };
}

export function formatTripSort(sort: TripSort): string {
  return `${sort.field},${sort.direction}`;
}
