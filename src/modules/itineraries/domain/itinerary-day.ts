import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';
import { ISO_DATE_REGEX } from '../../trips/domain/trip-date-range';

interface ItineraryDayProps extends Record<string, unknown> {
  id: string;
  tripId: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryDayInput {
  id?: string;
  tripId: string;
  date: string;
  tripStartDate: string;
  tripEndDate: string;
  createdAt?: Date;
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

    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');

    return new ItineraryDay({
      id: normalizeIdentifier(input.id ?? randomUUID(), 'Itinerary day id'),
      tripId: normalizeIdentifier(input.tripId, 'Trip id'),
      date,
      createdAt,
      updatedAt,
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

function ensureDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be a valid date.`);
  }

  return value;
}
