export const TRIP_SORT_FIELDS = [
  'startDate',
  'createdAt',
  'updatedAt',
  'name',
] as const;

export type TripSortField = (typeof TRIP_SORT_FIELDS)[number];

export type TripSortDirection = 'asc' | 'desc';

export interface TripSort {
  field: TripSortField;
  direction: TripSortDirection;
}

export const DEFAULT_TRIP_SORT: TripSort = {
  field: 'startDate',
  direction: 'asc',
};
