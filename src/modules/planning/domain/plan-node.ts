import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';
import { MAX_TRIP_BUDGET_AMOUNT } from '../../trips/domain/trip-budget';
import { MAX_TRIP_COVER_IMAGE_URL_LENGTH } from '../../trips/domain/trip';

export const PLAN_NODE_TYPES = [
  'section',
  'day',
  'location',
  'activity',
  'note',
] as const;

export type PlanNodeType = (typeof PLAN_NODE_TYPES)[number];

export const MAX_PLAN_NODE_TITLE_LENGTH = 160;
export const MAX_PLAN_NODE_NOTES_LENGTH = 4000;
export const ISO_DATE_TIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

interface PlanNodeProps extends Record<string, unknown> {
  id: string;
  tripId: string;
  parentId: string | null;
  type: PlanNodeType;
  title: string;
  notes: string | null;
  startAt: string | null;
  endAt: string | null;
  costAmount: number | null;
  costCurrency: string | null;
  imageUrl: string | null;
  sortOrder: number;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanNodeInput {
  id?: string;
  tripId: string;
  parentId?: string | null;
  type: string;
  title: string;
  notes?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  costAmount?: number | null;
  costCurrency?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  depth: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlanNodeUpdateInput {
  type?: string;
  title?: string;
  notes?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  costAmount?: number | null;
  costCurrency?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  updatedAt?: Date;
}

export class PlanNode extends Entity<PlanNodeProps> {
  private constructor(props: PlanNodeProps) {
    super(props);
  }

  static create(input: PlanNodeInput): PlanNode {
    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');
    const cost = normalizeCost(input.costAmount, input.costCurrency);
    const startAt = normalizeOptionalDateTime(input.startAt, 'Start at');
    const endAt = normalizeOptionalDateTime(input.endAt, 'End at');

    if (startAt !== null && endAt !== null && endAt < startAt) {
      throw new DomainError('End at must be on or after start at.');
    }

    return new PlanNode({
      id: normalizeIdentifier(input.id ?? randomUUID(), 'Plan node id'),
      tripId: normalizeIdentifier(input.tripId, 'Trip id'),
      parentId: normalizeOptionalIdentifier(input.parentId, 'Parent id'),
      type: normalizePlanNodeType(input.type),
      title: normalizeRequiredString(
        input.title,
        'Plan node title',
        MAX_PLAN_NODE_TITLE_LENGTH,
      ),
      notes: normalizeOptionalString(
        input.notes,
        'Plan node notes',
        MAX_PLAN_NODE_NOTES_LENGTH,
      ),
      startAt,
      endAt,
      costAmount: cost.amount,
      costCurrency: cost.currency,
      imageUrl: normalizeOptionalUrl(input.imageUrl, 'Plan node image URL'),
      sortOrder: normalizeNonNegativeInteger(input.sortOrder, 'Sort order'),
      depth: normalizeNonNegativeInteger(input.depth, 'Depth'),
      createdAt,
      updatedAt,
    });
  }

  update(input: PlanNodeUpdateInput): PlanNode {
    return PlanNode.create({
      id: this.id,
      tripId: this.tripId,
      parentId: this.parentId,
      type: input.type ?? this.type,
      title: input.title ?? this.title,
      notes: input.notes === undefined ? this.notes : input.notes,
      startAt: input.startAt === undefined ? this.startAt : input.startAt,
      endAt: input.endAt === undefined ? this.endAt : input.endAt,
      costAmount:
        input.costAmount === undefined ? this.costAmount : input.costAmount,
      costCurrency:
        input.costCurrency === undefined
          ? this.costCurrency
          : input.costCurrency,
      imageUrl: input.imageUrl === undefined ? this.imageUrl : input.imageUrl,
      sortOrder: input.sortOrder ?? this.sortOrder,
      depth: this.depth,
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

  get parentId(): string | null {
    return this.props.parentId;
  }

  get type(): PlanNodeType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get startAt(): string | null {
    return this.props.startAt;
  }

  get endAt(): string | null {
    return this.props.endAt;
  }

  get costAmount(): number | null {
    return this.props.costAmount;
  }

  get costCurrency(): string | null {
    return this.props.costCurrency;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get depth(): number {
    return this.props.depth;
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

function normalizeOptionalIdentifier(
  value: string | null | undefined,
  label: string,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return normalizeIdentifier(value, label);
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

function normalizeOptionalDateTime(
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

  if (!ISO_DATE_TIME_REGEX.test(normalizedValue)) {
    throw new DomainError(`${label} must be a valid ISO date-time string.`);
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

function normalizeNonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new DomainError(`${label} must be a non-negative integer.`);
  }

  return value;
}

function normalizePlanNodeType(value: string): PlanNodeType {
  if ((PLAN_NODE_TYPES as readonly string[]).includes(value)) {
    return value as PlanNodeType;
  }

  throw new DomainError('Plan node type is not supported.');
}

function normalizeCost(
  amount: number | null | undefined,
  currency: string | null | undefined,
) {
  const normalizedAmount = amount ?? null;
  const normalizedCurrency =
    currency === undefined || currency === null ? null : currency.trim();

  if (normalizedAmount === null && normalizedCurrency === null) {
    return {
      amount: null,
      currency: null,
    };
  }

  if (normalizedAmount === null || normalizedCurrency === null) {
    throw new DomainError(
      'Cost amount and cost currency must either both be provided or both be empty.',
    );
  }

  if (!Number.isInteger(normalizedAmount) || normalizedAmount < 0) {
    throw new DomainError('Cost amount must be a non-negative integer.');
  }

  if (normalizedAmount > MAX_TRIP_BUDGET_AMOUNT) {
    throw new DomainError(
      `Cost amount must be at most ${MAX_TRIP_BUDGET_AMOUNT}.`,
    );
  }

  if (!/^[a-zA-Z]{3}$/.test(normalizedCurrency)) {
    throw new DomainError('Cost currency must be a 3-letter code.');
  }

  return {
    amount: normalizedAmount,
    currency: normalizedCurrency.toUpperCase(),
  };
}

function ensureDate(value: Date, label: string): Date {
  if (Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be valid.`);
  }

  return value;
}
