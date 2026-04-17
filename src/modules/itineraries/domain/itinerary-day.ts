import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';
import { MAX_TRIP_COVER_IMAGE_URL_LENGTH } from '../../trips/domain/trip';
import { MAX_TRIP_BUDGET_AMOUNT } from '../../trips/domain/trip-budget';
import { ISO_DATE_REGEX } from '../../trips/domain/trip-date-range';

export const MAX_ITINERARY_DAY_TITLE_LENGTH = 160;
export const MAX_ITINERARY_DAY_LOCATION_LENGTH = 160;
export const MAX_ITINERARY_DAY_NOTES_LENGTH = 1000;
export const MAX_ITINERARY_DAY_IMAGE_COUNT = 12;
export const TIME_OF_DAY_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const ISO_CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

interface ItineraryDayProps extends Record<string, unknown> {
  id: string;
  tripId: string;
  date: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  notes: string | null;
  costAmount: number;
  costCurrency: string;
  position: number;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryDayInput {
  id?: string;
  tripId: string;
  date: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount: number;
  costCurrency: string;
  position: number;
  imageUrls?: string[];
  tripStartDate: string;
  tripEndDate: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItineraryDayUpdateInput {
  date?: string;
  title?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount?: number;
  costCurrency?: string;
  imageUrls?: string[];
  tripStartDate?: string;
  tripEndDate?: string;
  updatedAt?: Date;
}

export class ItineraryDay extends Entity<ItineraryDayProps> {
  private constructor(props: ItineraryDayProps) {
    super(props);
  }

  static create(input: ItineraryDayInput): ItineraryDay {
    const date = normalizeIsoDate(input.date, 'Itinerary day date');
    const tripStartDate = normalizeIsoDate(input.tripStartDate, 'Trip start date');
    const tripEndDate = normalizeIsoDate(input.tripEndDate, 'Trip end date');

    if (tripStartDate > tripEndDate) {
      throw new DomainError('Trip start date must be on or before trip end date.');
    }

    if (date < tripStartDate || date > tripEndDate) {
      throw new DomainError('Itinerary day date must be within the trip date range.');
    }

    const startsAt = normalizeTime(input.startsAt, 'Itinerary day start time');
    const endsAt = normalizeTime(input.endsAt, 'Itinerary day end time');
    ensureTimeRange(startsAt, endsAt);

    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');

    return new ItineraryDay({
      id: normalizeIdentifier(input.id ?? randomUUID(), 'Itinerary day id'),
      tripId: normalizeIdentifier(input.tripId, 'Trip id'),
      date,
      title: normalizeRequiredString(
        input.title,
        'Itinerary day title',
        MAX_ITINERARY_DAY_TITLE_LENGTH,
      ),
      startsAt,
      endsAt,
      location: normalizeOptionalString(
        input.location,
        'Itinerary day location',
        MAX_ITINERARY_DAY_LOCATION_LENGTH,
      ),
      notes: normalizeOptionalString(
        input.notes,
        'Itinerary day notes',
        MAX_ITINERARY_DAY_NOTES_LENGTH,
      ),
      costAmount: normalizeCostAmount(input.costAmount, 'Itinerary day cost amount'),
      costCurrency: normalizeCurrency(
        input.costCurrency,
        'Itinerary day cost currency',
      ),
      position: normalizePosition(input.position, 'Itinerary day position'),
      imageUrls: normalizeImageUrls(input.imageUrls),
      createdAt,
      updatedAt,
    });
  }

  update(input: ItineraryDayUpdateInput): ItineraryDay {
    return ItineraryDay.create({
      id: this.id,
      tripId: this.tripId,
      date: input.date ?? this.date,
      title: input.title ?? this.title,
      startsAt: input.startsAt === undefined ? this.startsAt : input.startsAt,
      endsAt: input.endsAt === undefined ? this.endsAt : input.endsAt,
      location: input.location === undefined ? this.location : input.location,
      notes: input.notes === undefined ? this.notes : input.notes,
      costAmount: input.costAmount ?? this.costAmount,
      costCurrency: input.costCurrency ?? this.costCurrency,
      position: this.position,
      imageUrls: input.imageUrls ?? this.imageUrls,
      tripStartDate: input.tripStartDate ?? this.date,
      tripEndDate: input.tripEndDate ?? this.date,
      createdAt: this.createdAt,
      updatedAt: input.updatedAt ?? new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get tripId(): string {
    return this.props.tripId;
  }

  get date(): string {
    return this.props.date;
  }

  get title(): string {
    return this.props.title;
  }

  get startsAt(): string | null {
    return this.props.startsAt;
  }

  get endsAt(): string | null {
    return this.props.endsAt;
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

  get imageUrls(): string[] {
    return [...this.props.imageUrls];
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

function normalizeIsoDate(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (
    !ISO_DATE_REGEX.test(normalizedValue) ||
    !isCalendarDate(normalizedValue)
  ) {
    throw new DomainError(`${label} must use YYYY-MM-DD format.`);
  }

  return normalizedValue;
}

function isCalendarDate(value: string): boolean {
  const normalizedDate = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(normalizedDate.getTime()) &&
    normalizedDate.toISOString().slice(0, 10) === value
  );
}

function normalizeTime(
  value: string | null | undefined,
  label: string,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  if (!TIME_OF_DAY_REGEX.test(normalizedValue)) {
    throw new DomainError(`${label} must use HH:MM format.`);
  }

  return normalizedValue;
}

function ensureTimeRange(startsAt: string | null, endsAt: string | null): void {
  if (startsAt !== null && endsAt !== null && startsAt > endsAt) {
    throw new DomainError(
      'Itinerary day end time must be on or after the itinerary day start time.',
    );
  }
}

function normalizeCostAmount(value: number, label: string): number {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_TRIP_BUDGET_AMOUNT
  ) {
    throw new DomainError(
      `${label} must be a whole number between 0 and ${MAX_TRIP_BUDGET_AMOUNT}.`,
    );
  }

  return value;
}

function normalizeCurrency(value: string, label: string): string {
  const normalizedValue = value.trim().toUpperCase();

  if (!ISO_CURRENCY_CODE_REGEX.test(normalizedValue)) {
    throw new DomainError(`${label} must be a valid ISO 4217 currency code.`);
  }

  return normalizedValue;
}

function normalizePosition(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new DomainError(`${label} must be a positive whole number.`);
  }

  return value;
}

function normalizeImageUrls(value: string[] | undefined): string[] {
  const imageUrls = value ?? [];

  if (imageUrls.length > MAX_ITINERARY_DAY_IMAGE_COUNT) {
    throw new DomainError(
      `Itinerary day images must contain at most ${MAX_ITINERARY_DAY_IMAGE_COUNT} items.`,
    );
  }

  return imageUrls.map((imageUrl, index) =>
    normalizeOptionalUrl(imageUrl, `Itinerary day image URL #${index + 1}`),
  );
}

function normalizeOptionalUrl(value: string, label: string): string {
  const normalizedValue = normalizeRequiredString(
    value,
    label,
    MAX_TRIP_COVER_IMAGE_URL_LENGTH,
  );

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

function ensureDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be a valid date.`);
  }

  return value;
}
