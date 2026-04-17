import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';
import { MAX_TRIP_BUDGET_AMOUNT } from '../../trips/domain/trip-budget';

export const MAX_ITINERARY_ACTIVITY_TITLE_LENGTH = 160;
export const MAX_ITINERARY_ACTIVITY_LOCATION_LENGTH = 160;
export const MAX_ITINERARY_ACTIVITY_NOTES_LENGTH = 1000;
export const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const ISO_CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

interface ItineraryActivityProps extends Record<string, unknown> {
  id: string;
  itineraryDayId: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  notes: string | null;
  costAmount: number;
  costCurrency: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryActivityInput {
  id?: string;
  itineraryDayId: string;
  title: string;
  startsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount: number;
  costCurrency: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItineraryActivityUpdateInput {
  title?: string;
  startsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount?: number;
  costCurrency?: string;
  updatedAt?: Date;
}

export class ItineraryActivity extends Entity<ItineraryActivityProps> {
  private constructor(props: ItineraryActivityProps) {
    super(props);
  }

  static create(input: ItineraryActivityInput): ItineraryActivity {
    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');

    return new ItineraryActivity({
      id: normalizeIdentifier(input.id ?? randomUUID(), 'Itinerary activity id'),
      itineraryDayId: normalizeIdentifier(
        input.itineraryDayId,
        'Itinerary day id',
      ),
      title: normalizeRequiredString(
        input.title,
        'Activity title',
        MAX_ITINERARY_ACTIVITY_TITLE_LENGTH,
      ),
      startsAt: normalizeStartsAt(input.startsAt),
      location: normalizeOptionalString(
        input.location,
        'Activity location',
        MAX_ITINERARY_ACTIVITY_LOCATION_LENGTH,
      ),
      notes: normalizeOptionalString(
        input.notes,
        'Activity notes',
        MAX_ITINERARY_ACTIVITY_NOTES_LENGTH,
      ),
      costAmount: normalizeCostAmount(input.costAmount),
      costCurrency: normalizeCurrency(input.costCurrency),
      position: normalizePosition(input.position),
      createdAt,
      updatedAt,
    });
  }

  update(input: ItineraryActivityUpdateInput): ItineraryActivity {
    return ItineraryActivity.create({
      id: this.id,
      itineraryDayId: this.itineraryDayId,
      title: input.title ?? this.title,
      startsAt:
        input.startsAt === undefined ? this.startsAt : input.startsAt,
      location:
        input.location === undefined ? this.location : input.location,
      notes: input.notes === undefined ? this.notes : input.notes,
      costAmount: input.costAmount ?? this.costAmount,
      costCurrency: input.costCurrency ?? this.costCurrency,
      position: this.position,
      createdAt: this.createdAt,
      updatedAt: input.updatedAt ?? new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get itineraryDayId(): string {
    return this.props.itineraryDayId;
  }

  get title(): string {
    return this.props.title;
  }

  get startsAt(): string | null {
    return this.props.startsAt;
  }

  get location(): string | null {
    return this.props.location;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get costAmount(): number {
    return this.props.costAmount;
  }

  get costCurrency(): string {
    return this.props.costCurrency;
  }

  get position(): number {
    return this.props.position;
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

function normalizeStartsAt(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  if (!TIME_OF_DAY_REGEX.test(normalizedValue)) {
    throw new DomainError('Activity start time must use HH:MM format.');
  }

  return normalizedValue;
}

function normalizeCostAmount(value: number): number {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_TRIP_BUDGET_AMOUNT
  ) {
    throw new DomainError(
      `Activity cost amount must be a whole number between 0 and ${MAX_TRIP_BUDGET_AMOUNT}.`,
    );
  }

  return value;
}

function normalizeCurrency(value: string): string {
  const normalizedValue = value.trim().toUpperCase();

  if (!ISO_CURRENCY_CODE_REGEX.test(normalizedValue)) {
    throw new DomainError(
      'Activity cost currency must be a valid ISO 4217 currency code.',
    );
  }

  return normalizedValue;
}

function normalizePosition(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new DomainError('Activity position must be a positive whole number.');
  }

  return value;
}

function ensureDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be a valid date.`);
  }

  return value;
}
