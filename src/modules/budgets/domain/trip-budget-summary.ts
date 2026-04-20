import { DomainError } from '../../../shared/domain/domain-error';
import { ValueObject } from '../../../shared/domain/value-object';

const MAX_AGGREGATED_BUDGET_AMOUNT = Number.MAX_SAFE_INTEGER;
const ISO_CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

interface TripBudgetSummaryProps {
  tripId: string;
  currency: string;
  totalBudgetAmount: number;
  totalPlannedAmount: number;
  remainingAmount: number;
  totalDays: number;
  totalActivities: number;
  isOverBudget: boolean;
  hasMixedCurrencies: boolean;
  totalsByCurrency: TripBudgetSummaryCurrencyTotal[];
}

export interface TripBudgetSummaryCurrencyTotal {
  currency: string;
  plannedAmount: number;
  nodeCount: number;
}

export interface TripBudgetSummaryInput {
  tripId: string;
  currency: string;
  totalBudgetAmount: number;
  totalPlannedAmount: number;
  totalDays: number;
  totalActivities: number;
  hasMixedCurrencies?: boolean;
  totalsByCurrency?: TripBudgetSummaryCurrencyTotal[];
}

export class TripBudgetSummary extends ValueObject<TripBudgetSummaryProps> {
  private constructor(value: TripBudgetSummaryProps) {
    super(value);
  }

  static create(input: TripBudgetSummaryInput): TripBudgetSummary {
    const tripId = normalizeIdentifier(input.tripId, 'Trip id');
    const currency = normalizeCurrency(input.currency);
    const totalBudgetAmount = normalizeAmount(
      input.totalBudgetAmount,
      'Total budget amount',
    );
    const totalPlannedAmount = normalizeAmount(
      input.totalPlannedAmount,
      'Total planned amount',
    );
    const totalDays = normalizeCount(input.totalDays, 'Total days');
    const totalActivities = normalizeCount(
      input.totalActivities,
      'Total activities',
    );
    const totalsByCurrency = normalizeTotalsByCurrency(
      input.totalsByCurrency ?? [],
    );
    const hasMixedCurrencies = normalizeBoolean(
      input.hasMixedCurrencies ?? false,
      'Has mixed currencies',
    );

    return new TripBudgetSummary({
      tripId,
      currency,
      totalBudgetAmount,
      totalPlannedAmount,
      remainingAmount: totalBudgetAmount - totalPlannedAmount,
      totalDays,
      totalActivities,
      isOverBudget: totalPlannedAmount > totalBudgetAmount,
      hasMixedCurrencies,
      totalsByCurrency,
    });
  }

  get tripId(): string {
    return this.value.tripId;
  }

  get currency(): string {
    return this.value.currency;
  }

  get totalBudgetAmount(): number {
    return this.value.totalBudgetAmount;
  }

  get totalPlannedAmount(): number {
    return this.value.totalPlannedAmount;
  }

  get remainingAmount(): number {
    return this.value.remainingAmount;
  }

  get totalDays(): number {
    return this.value.totalDays;
  }

  get totalActivities(): number {
    return this.value.totalActivities;
  }

  get isOverBudget(): boolean {
    return this.value.isOverBudget;
  }

  get hasMixedCurrencies(): boolean {
    return this.value.hasMixedCurrencies;
  }

  get totalsByCurrency(): TripBudgetSummaryCurrencyTotal[] {
    return [...this.value.totalsByCurrency];
  }
}

function normalizeIdentifier(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeCurrency(value: string): string {
  const normalizedValue = value.trim().toUpperCase();

  if (!ISO_CURRENCY_CODE_REGEX.test(normalizedValue)) {
    throw new DomainError(
      'Budget summary currency must be a valid ISO 4217 currency code.',
    );
  }

  return normalizedValue;
}

function normalizeAmount(value: number, label: string): number {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_AGGREGATED_BUDGET_AMOUNT
  ) {
    throw new DomainError(
      `${label} must be a whole number between 0 and ${MAX_AGGREGATED_BUDGET_AMOUNT}.`,
    );
  }

  return value;
}

function normalizeCount(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new DomainError(`${label} must be a whole number greater than or equal to 0.`);
  }

  return value;
}

function normalizeBoolean(value: boolean, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new DomainError(`${label} must be a boolean.`);
  }

  return value;
}

function normalizeTotalsByCurrency(
  value: TripBudgetSummaryCurrencyTotal[],
): TripBudgetSummaryCurrencyTotal[] {
  return value.map((entry) => ({
    currency: normalizeCurrency(entry.currency),
    plannedAmount: normalizeAmount(
      entry.plannedAmount,
      'Planned amount by currency',
    ),
    nodeCount: normalizeCount(entry.nodeCount, 'Node count by currency'),
  }));
}
