import { DomainError } from '../../../shared/domain/domain-error';

export const TRIP_VISIBILITIES = ['private', 'unlisted', 'public'] as const;

export type TripVisibility = (typeof TRIP_VISIBILITIES)[number];

export const DEFAULT_TRIP_VISIBILITY: TripVisibility = 'private';

export const PUBLICLY_READABLE_TRIP_VISIBILITIES: readonly TripVisibility[] = [
  'unlisted',
  'public',
];

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

  throw new DomainError(
    'Trip visibility must be private, unlisted, or public.',
  );
}

export function isTripPubliclyReadable(visibility: TripVisibility): boolean {
  return PUBLICLY_READABLE_TRIP_VISIBILITIES.includes(visibility);
}
