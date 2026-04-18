import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';
import { TripBudget } from './trip-budget';
import {
  normalizeTripBudgetMode,
  type TripBudgetMode,
} from './trip-budget-mode';
import { TripDateRange } from './trip-date-range';
import {
  normalizeTripVisibility,
  type TripVisibility,
} from './trip-visibility';

export const MAX_TRIP_NAME_LENGTH = 120;
export const MAX_TRIP_DESTINATION_LENGTH = 160;
export const MAX_TRIP_TIMEZONE_LENGTH = 100;
export const MAX_TRIP_SUMMARY_NOTES_LENGTH = 2000;
export const MAX_TRIP_COVER_IMAGE_URL_LENGTH = 2048;
const DEFAULT_INTERNAL_BUDGET_CURRENCY = 'VND';

interface TripProps extends Record<string, unknown> {
  id: string;
  userId: string;
  name: string;
  destination: string | null;
  summaryNotes: string | null;
  coverImageUrl: string | null;
  dateRange: TripDateRange;
  timezone: string | null;
  compatibilityBudget: TripBudget;
  budgetMode: TripBudgetMode;
  manualBudget: TripBudget | null;
  visibility: TripVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripInput {
  id?: string;
  userId: string;
  name: string;
  destination?: string | null;
  summaryNotes?: string | null;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
  timezone?: string | null;
  budgetAmount?: number;
  budgetCurrency?: string;
  budgetMode?: string;
  manualBudgetAmount?: number | null;
  manualBudgetCurrency?: string | null;
  visibility?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripUpdateInput {
  name?: string;
  destination?: string | null;
  summaryNotes?: string | null;
  coverImageUrl?: string | null;
  startDate?: string;
  endDate?: string;
  timezone?: string | null;
  budgetAmount?: number;
  budgetCurrency?: string;
  budgetMode?: string;
  manualBudgetAmount?: number | null;
  manualBudgetCurrency?: string | null;
  visibility?: string;
  updatedAt?: Date;
}

export class Trip extends Entity<TripProps> {
  private constructor(props: TripProps) {
    super(props);
  }

  static create(input: TripInput): Trip {
    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');
    const budgetMode = resolveTripBudgetMode(input);
    const manualBudget = resolveManualBudget(input, budgetMode);
    const compatibilityBudget = resolveCompatibilityBudget(input, manualBudget);

    return new Trip({
      id: normalizeIdentifier(input.id ?? randomUUID(), 'Trip id'),
      userId: normalizeIdentifier(input.userId, 'User id'),
      name: normalizeRequiredString(
        input.name,
        'Trip name',
        MAX_TRIP_NAME_LENGTH,
      ),
      destination: normalizeOptionalString(
        input.destination,
        'Destination',
        MAX_TRIP_DESTINATION_LENGTH,
      ),
      summaryNotes: normalizeOptionalString(
        input.summaryNotes,
        'Trip summary notes',
        MAX_TRIP_SUMMARY_NOTES_LENGTH,
      ),
      coverImageUrl: normalizeOptionalUrl(
        input.coverImageUrl,
        'Trip cover image URL',
      ),
      dateRange: TripDateRange.create({
        startDate: input.startDate,
        endDate: input.endDate,
      }),
      timezone: normalizeTimezone(input.timezone),
      compatibilityBudget,
      budgetMode,
      manualBudget,
      visibility: normalizeTripVisibility(input.visibility),
      createdAt,
      updatedAt,
    });
  }

  update(input: TripUpdateInput): Trip {
    const nextBudgetMode = resolveNextBudgetMode(this, input);
    const nextManualBudget = resolveNextManualBudget(
      this,
      input,
      nextBudgetMode,
    );

    return Trip.create({
      id: this.id,
      userId: this.userId,
      name: input.name ?? this.name,
      destination: input.destination ?? this.destination,
      summaryNotes:
        input.summaryNotes === undefined
          ? this.summaryNotes
          : input.summaryNotes,
      coverImageUrl:
        input.coverImageUrl === undefined
          ? this.coverImageUrl
          : input.coverImageUrl,
      startDate: input.startDate ?? this.startDate,
      endDate: input.endDate ?? this.endDate,
      timezone: input.timezone ?? this.timezone,
      budgetAmount: input.budgetAmount ?? this.budgetAmount,
      budgetCurrency: input.budgetCurrency ?? this.budgetCurrency,
      budgetMode: nextBudgetMode,
      manualBudgetAmount:
        nextManualBudget === null ? null : nextManualBudget.amount,
      manualBudgetCurrency:
        nextManualBudget === null ? null : nextManualBudget.currency,
      visibility: input.visibility ?? this.visibility,
      createdAt: this.createdAt,
      updatedAt: input.updatedAt ?? new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get destination(): string | null {
    return this.props.destination;
  }

  get summaryNotes(): string | null {
    return this.props.summaryNotes;
  }

  get coverImageUrl(): string | null {
    return this.props.coverImageUrl;
  }

  get startDate(): string {
    return this.props.dateRange.startDate;
  }

  get endDate(): string {
    return this.props.dateRange.endDate;
  }

  get timezone(): string | null {
    return this.props.timezone;
  }

  get budgetAmount(): number {
    return this.props.compatibilityBudget.amount;
  }

  get budgetCurrency(): string {
    return this.props.compatibilityBudget.currency;
  }

  get budgetMode(): TripBudgetMode {
    return this.props.budgetMode;
  }

  get manualBudgetAmount(): number | null {
    return this.props.manualBudget?.amount ?? null;
  }

  get manualBudgetCurrency(): string | null {
    return this.props.manualBudget?.currency ?? null;
  }

  get visibility(): TripVisibility {
    return this.props.visibility;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function normalizeIdentifier(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeRequiredString(
  value: string,
  label: string,
  maxLength: number,
): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  if (normalizedValue.length > maxLength) {
    throw new DomainError(`${label} must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
}

function normalizeOptionalString(
  value: string | null | undefined,
  label: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    throw new DomainError(`${label} must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
}

function normalizeOptionalUrl(
  value: string | null | undefined,
  label: string,
): string | null {
  const normalizedValue = normalizeOptionalString(
    value,
    label,
    MAX_TRIP_COVER_IMAGE_URL_LENGTH,
  );

  if (normalizedValue === null) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new DomainError(`${label} must be a valid http or https URL.`);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new DomainError(`${label} must be a valid http or https URL.`);
  }

  return normalizedValue;
}

function normalizeTimezone(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  if (normalizedValue.length > MAX_TRIP_TIMEZONE_LENGTH) {
    throw new DomainError(
      `Timezone must be at most ${MAX_TRIP_TIMEZONE_LENGTH} characters.`,
    );
  }

  try {
    new Intl.DateTimeFormat('en-US', {
      timeZone: normalizedValue,
    });
  } catch {
    throw new DomainError('Timezone must be a valid IANA timezone.');
  }

  return normalizedValue;
}

function resolveTripBudgetMode(input: TripInput): TripBudgetMode {
  return normalizeTripBudgetMode(
    input.budgetMode ?? (hasAnyBudgetValue(input) ? 'manual' : undefined),
  );
}

function resolveCompatibilityBudget(
  input: TripInput,
  manualBudget: TripBudget | null,
): TripBudget {
  const compatibilityAmount = normalizeOptionalBudgetAmount(input.budgetAmount);
  const compatibilityCurrency = normalizeOptionalBudgetCurrency(
    input.budgetCurrency,
  );

  if (
    compatibilityAmount !== undefined ||
    compatibilityCurrency !== undefined
  ) {
    if (
      compatibilityAmount === undefined ||
      compatibilityCurrency === undefined
    ) {
      throw new DomainError(
        'Budget amount and budget currency must be provided together.',
      );
    }

    return TripBudget.create({
      amount: compatibilityAmount,
      currency: compatibilityCurrency,
    });
  }

  if (manualBudget !== null) {
    return manualBudget;
  }

  return TripBudget.create({
    amount: 0,
    currency: DEFAULT_INTERNAL_BUDGET_CURRENCY,
  });
}

function resolveManualBudget(
  input: TripInput,
  budgetMode: TripBudgetMode,
): TripBudget | null {
  const manualBudgetAmount = normalizeOptionalBudgetAmount(
    input.manualBudgetAmount,
  );
  const compatibilityBudgetAmount = normalizeOptionalBudgetAmount(
    input.budgetAmount,
  );
  const manualBudgetCurrency = normalizeOptionalBudgetCurrency(
    input.manualBudgetCurrency,
  );
  const compatibilityBudgetCurrency = normalizeOptionalBudgetCurrency(
    input.budgetCurrency,
  );
  const amount = manualBudgetAmount ?? compatibilityBudgetAmount;
  const currency = manualBudgetCurrency ?? compatibilityBudgetCurrency;

  if (budgetMode === 'auto') {
    if (
      manualBudgetAmount !== undefined ||
      manualBudgetCurrency !== undefined
    ) {
      throw new DomainError(
        'Manual budget must be empty when budget mode is auto.',
      );
    }

    return null;
  }

  if (
    amount === undefined ||
    currency === undefined ||
    amount === null ||
    currency === null
  ) {
    throw new DomainError(
      'Manual budget amount and currency are required when budget mode is manual.',
    );
  }

  return TripBudget.create({
    amount,
    currency,
  });
}

function hasAnyBudgetValue(input: TripInput): boolean {
  return (
    normalizeOptionalBudgetAmount(input.budgetAmount) !== undefined ||
    normalizeOptionalBudgetCurrency(input.budgetCurrency) !== undefined ||
    normalizeOptionalBudgetAmount(input.manualBudgetAmount) !== undefined ||
    normalizeOptionalBudgetCurrency(input.manualBudgetCurrency) !== undefined
  );
}

function resolveNextBudgetMode(
  currentTrip: Trip,
  input: TripUpdateInput,
): TripBudgetMode {
  return normalizeTripBudgetMode(input.budgetMode ?? currentTrip.budgetMode);
}

function resolveNextManualBudget(
  currentTrip: Trip,
  input: TripUpdateInput,
  budgetMode: TripBudgetMode,
): TripBudget | null {
  if (budgetMode === 'auto') {
    if (
      normalizeOptionalBudgetAmount(input.manualBudgetAmount) !== undefined ||
      normalizeOptionalBudgetCurrency(input.manualBudgetCurrency) !== undefined
    ) {
      throw new DomainError(
        'Manual budget must be empty when budget mode is auto.',
      );
    }

    return null;
  }

  const amount =
    input.manualBudgetAmount ??
    input.budgetAmount ??
    currentTrip.manualBudgetAmount ??
    currentTrip.budgetAmount;
  const currency =
    input.manualBudgetCurrency ??
    input.budgetCurrency ??
    currentTrip.manualBudgetCurrency ??
    currentTrip.budgetCurrency;

  return TripBudget.create({
    amount,
    currency,
  });
}

function normalizeOptionalBudgetAmount(
  value: number | null | undefined,
): number | undefined {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return undefined;
  }

  return value;
}

function normalizeOptionalBudgetCurrency(
  value: string | null | undefined,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return value;
}

function ensureDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be a valid date.`);
  }

  return value;
}
