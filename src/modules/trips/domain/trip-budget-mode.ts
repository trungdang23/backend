import { DomainError } from '../../../shared/domain/domain-error';

export const TRIP_BUDGET_MODES = ['auto', 'manual'] as const;

export type TripBudgetMode = (typeof TRIP_BUDGET_MODES)[number];

export const DEFAULT_TRIP_BUDGET_MODE: TripBudgetMode = 'auto';

export function normalizeTripBudgetMode(
  value: string | undefined,
): TripBudgetMode {
  if (value === undefined) {
    return DEFAULT_TRIP_BUDGET_MODE;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (TRIP_BUDGET_MODES.includes(normalizedValue as TripBudgetMode)) {
    return normalizedValue as TripBudgetMode;
  }

  throw new DomainError('Trip budget mode must be either auto or manual.');
}
