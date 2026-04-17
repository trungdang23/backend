import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';
import { MAX_TRIP_COVER_IMAGE_URL_LENGTH } from '../../trips/domain/trip';
import { MAX_TRIP_BUDGET_AMOUNT } from '../../trips/domain/trip-budget';
import {
  MAX_ITINERARY_DAY_IMAGE_COUNT,
  TIME_OF_DAY_REGEX,
} from './itinerary-day';

export const MAX_ITINERARY_ACTIVITY_TITLE_LENGTH = 160;
export const MAX_ITINERARY_ACTIVITY_LOCATION_LENGTH = 160;
export const MAX_ITINERARY_ACTIVITY_NOTES_LENGTH = 1000;

const ISO_CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

interface ItineraryActivityProps extends Record<string, unknown> {
  id: string;
  itineraryDayId: string;
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

export interface ItineraryActivityInput {
  id?: string;
  itineraryDayId: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount: number;
  costCurrency: string;
  position: number;
  imageUrls?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItineraryActivityUpdateInput {
  title?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount?: number;
  costCurrency?: string;
  imageUrls?: string[];
  updatedAt?: Date;
}

export class ItineraryActivity extends Entity<ItineraryActivityProps> {
  private constructor(props: ItineraryActivityProps) {
    super(props);
  }

  static create(input: ItineraryActivityInput): ItineraryActivity {
    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');
    const startsAt = normalizeTime(input.startsAt, 'Activity start time');
    const endsAt = normalizeTime(input.endsAt, 'Activity end time');

    ensureTimeRange(startsAt, endsAt);

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
      startsAt,
      endsAt,
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
      imageUrls: normalizeImageUrls(input.imageUrls),
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
      endsAt: input.endsAt === undefined ? this.endsAt : input.endsAt,
      location:
        input.location === undefined ? this.location : input.location,
      notes: input.notes === undefined ? this.notes : input.notes,
      costAmount: input.costAmount ?? this.costAmount,
      costCurrency: input.costCurrency ?? this.costCurrency,
      position: this.position,
      imageUrls: input.imageUrls ?? this.imageUrls,
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
      'Activity end time must be on or after the activity start time.',
    );
  }
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

function normalizeImageUrls(value: string[] | undefined): string[] {
  const imageUrls = value ?? [];

  if (imageUrls.length > MAX_ITINERARY_DAY_IMAGE_COUNT) {
    throw new DomainError(
      `Activity images must contain at most ${MAX_ITINERARY_DAY_IMAGE_COUNT} items.`,
    );
  }

  return imageUrls.map((imageUrl, index) =>
    normalizeOptionalUrl(imageUrl, `Activity image URL #${index + 1}`),
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
