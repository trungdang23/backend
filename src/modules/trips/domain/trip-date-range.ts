import { DomainError } from '../../../shared/domain/domain-error';
import { ValueObject } from '../../../shared/domain/value-object';

export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface TripDateRangeProps {
  startDate: string;
  endDate: string;
}

export class TripDateRange extends ValueObject<TripDateRangeProps> {
  private constructor(value: TripDateRangeProps) {
    super(value);
  }

  static create(input: {
    startDate: string;
    endDate: string;
  }): TripDateRange {
    const startDate = normalizeIsoDate(input.startDate, 'Start date');
    const endDate = normalizeIsoDate(input.endDate, 'End date');

    if (startDate > endDate) {
      throw new DomainError('Start date must be on or before end date.');
    }

    return new TripDateRange({
      startDate,
      endDate,
    });
  }

  get startDate(): string {
    return this.value.startDate;
  }

  get endDate(): string {
    return this.value.endDate;
  }
}

function normalizeIsoDate(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (!ISO_DATE_REGEX.test(normalizedValue) || !isCalendarDate(normalizedValue)) {
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
