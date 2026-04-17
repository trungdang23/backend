import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';
import { TripBudget } from './trip-budget';
import { TripDateRange } from './trip-date-range';

export const MAX_TRIP_NAME_LENGTH = 120;
export const MAX_TRIP_DESTINATION_LENGTH = 160;
export const MAX_TRIP_TIMEZONE_LENGTH = 100;
export const MAX_TRIP_SUMMARY_NOTES_LENGTH = 2000;
export const MAX_TRIP_COVER_IMAGE_URL_LENGTH = 2048;

interface TripProps extends Record<string, unknown> {
  id: string;
  userId: string;
  name: string;
  destination: string;
  summaryNotes: string | null;
  coverImageUrl: string | null;
  dateRange: TripDateRange;
  timezone: string;
  budget: TripBudget;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripInput {
  id?: string;
  userId: string;
  name: string;
  destination: string;
  summaryNotes?: string | null;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
  timezone: string;
  budgetAmount: number;
  budgetCurrency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripUpdateInput {
  name?: string;
  destination?: string;
  summaryNotes?: string | null;
  coverImageUrl?: string | null;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  updatedAt?: Date;
}

export class Trip extends Entity<TripProps> {
  private constructor(props: TripProps) {
    super(props);
  }

  static create(input: TripInput): Trip {
    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');

    return new Trip({
      id: normalizeIdentifier(input.id ?? randomUUID(), 'Trip id'),
      userId: normalizeIdentifier(input.userId, 'User id'),
      name: normalizeRequiredString(
        input.name,
        'Trip name',
        MAX_TRIP_NAME_LENGTH,
      ),
      destination: normalizeRequiredString(
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
      budget: TripBudget.create({
        amount: input.budgetAmount,
        currency: input.budgetCurrency,
      }),
      createdAt,
      updatedAt,
    });
  }

  update(input: TripUpdateInput): Trip {
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

  get destination(): string {
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

  get timezone(): string {
    return this.props.timezone;
  }

  get budgetAmount(): number {
    return this.props.budget.amount;
  }

  get budgetCurrency(): string {
    return this.props.budget.currency;
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

function normalizeTimezone(value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError('Timezone is required.');
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

function ensureDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be a valid date.`);
  }

  return value;
}
