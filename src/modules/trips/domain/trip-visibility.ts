import { DomainError } from '../../../shared/domain/domain-error';

export const TRIP_VISIBILITIES = ['private', 'public'] as const;

export type TripVisibility = (typeof TRIP_VISIBILITIES)[number];

export const DEFAULT_TRIP_VISIBILITY: TripVisibility = 'private';

export function normalizeTripVisibility(
  value: string | undefined,
): TripVisibility {
  if (value === undefined) {
    return DEFAULT_TRIP_VISIBILITY;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (TRIP_VISIBILITIES.includes(normalizedValue as TripVisibility)) {
    return normalizedValue as TripVisibility;
  }

  throw new DomainError('Trip visibility must be either private or public.');
}
