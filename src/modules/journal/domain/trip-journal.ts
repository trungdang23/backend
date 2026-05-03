import { DomainError } from '../../../shared/domain/domain-error';

export const JOURNAL_SCENE_VERSION = 1;
export const MAX_JOURNAL_OBJECTS = 120;
export const MAX_JOURNAL_OBJECT_ID_LENGTH = 120;
export const MAX_JOURNAL_BACKGROUND_STYLE_LENGTH = 80;
export const JOURNAL_OBJECT_TYPES = [
  'photo',
  'sticker',
  'note',
  'tape',
] as const;

export type JournalObjectType = (typeof JOURNAL_OBJECT_TYPES)[number];

export interface JournalPageBackground extends Record<string, unknown> {
  style: string;
}

export interface JournalPage extends Record<string, unknown> {
  width: number;
  height: number;
  background: JournalPageBackground;
}

export interface JournalSceneObject extends Record<string, unknown> {
  id: string;
  type: JournalObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  props: Record<string, unknown>;
}

export interface TripJournalInput {
  id?: string | null;
  tripId: string;
  sceneVersion?: number;
  page?: JournalPage;
  objects?: JournalSceneObject[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface TripJournalProps {
  id: string | null;
  tripId: string;
  sceneVersion: number;
  page: JournalPage;
  objects: JournalSceneObject[];
  createdAt: Date;
  updatedAt: Date;
}

export class TripJournal {
  private constructor(private readonly props: TripJournalProps) {}

  static create(input: TripJournalInput): TripJournal {
    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');

    return new TripJournal({
      id: normalizeOptionalIdentifier(input.id, 'Journal id'),
      tripId: normalizeIdentifier(input.tripId, 'Trip id'),
      sceneVersion: normalizeSceneVersion(
        input.sceneVersion ?? JOURNAL_SCENE_VERSION,
      ),
      page: normalizePage(input.page ?? createDefaultJournalPage()),
      objects: normalizeObjects(input.objects ?? []),
      createdAt,
      updatedAt,
    });
  }

  static createEmpty(input: { tripId: string }): TripJournal {
    return TripJournal.create({
      id: null,
      tripId: input.tripId,
      sceneVersion: JOURNAL_SCENE_VERSION,
      page: createDefaultJournalPage(),
      objects: [],
    });
  }

  get id(): string | null {
    return this.props.id;
  }

  get tripId(): string {
    return this.props.tripId;
  }

  get sceneVersion(): number {
    return this.props.sceneVersion;
  }

  get page(): JournalPage {
    return this.props.page;
  }

  get objects(): JournalSceneObject[] {
    return this.props.objects;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function createDefaultJournalPage(): JournalPage {
  return {
    width: 1200,
    height: 1600,
    background: {
      style: 'paper-cream',
    },
  };
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

function normalizeSceneVersion(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new DomainError('Journal scene version is invalid.');
  }

  return value;
}

function normalizePage(page: JournalPage): JournalPage {
  if (!isRecord(page)) {
    throw new DomainError('Journal page must be an object.');
  }

  if (!Number.isInteger(page.width) || page.width < 320 || page.width > 4000) {
    throw new DomainError('Journal page width is invalid.');
  }

  if (
    !Number.isInteger(page.height) ||
    page.height < 320 ||
    page.height > 5000
  ) {
    throw new DomainError('Journal page height is invalid.');
  }

  if (!isRecord(page.background)) {
    throw new DomainError('Journal page background is required.');
  }

  return {
    width: page.width,
    height: page.height,
    background: {
      style: normalizeBoundedString(
        page.background.style,
        'Journal background style',
        MAX_JOURNAL_BACKGROUND_STYLE_LENGTH,
      ),
    },
  };
}

function normalizeObjects(objects: JournalSceneObject[]): JournalSceneObject[] {
  if (!Array.isArray(objects)) {
    throw new DomainError('Journal objects must be an array.');
  }

  if (objects.length > MAX_JOURNAL_OBJECTS) {
    throw new DomainError(
      `Journal must contain at most ${MAX_JOURNAL_OBJECTS} objects.`,
    );
  }

  const seenObjectIds = new Set<string>();

  return objects.map((object) => {
    if (!isRecord(object)) {
      throw new DomainError('Journal object must be an object.');
    }

    const id = normalizeBoundedString(
      object.id,
      'Journal object id',
      MAX_JOURNAL_OBJECT_ID_LENGTH,
    );

    if (seenObjectIds.has(id)) {
      throw new DomainError('Journal object ids must be unique.');
    }

    seenObjectIds.add(id);

    const type = normalizeObjectType(object.type);

    return {
      id,
      type,
      x: normalizeFiniteNumber(object.x, 'Journal object x', -4000, 8000),
      y: normalizeFiniteNumber(object.y, 'Journal object y', -4000, 9000),
      width: normalizeFiniteNumber(
        object.width,
        'Journal object width',
        1,
        4000,
      ),
      height: normalizeFiniteNumber(
        object.height,
        'Journal object height',
        1,
        4000,
      ),
      rotation: normalizeFiniteNumber(
        object.rotation,
        'Journal object rotation',
        -360,
        360,
      ),
      zIndex: normalizeInteger(object.zIndex, 'Journal object z-index', 0, 10000),
      locked: normalizeBoolean(object.locked ?? false, 'Journal object locked'),
      props: cloneJsonObject(object.props ?? {}),
    };
  });
}

function normalizeObjectType(value: unknown): JournalObjectType {
  if (
    typeof value === 'string' &&
    JOURNAL_OBJECT_TYPES.includes(value as JournalObjectType)
  ) {
    return value as JournalObjectType;
  }

  throw new DomainError('Journal object type is invalid.');
}

function normalizeBoundedString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== 'string') {
    throw new DomainError(`${label} is required.`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  if (normalizedValue.length > maxLength) {
    throw new DomainError(`${label} must be at most ${maxLength} characters.`);
  }

  return normalizedValue;
}

function normalizeFiniteNumber(
  value: unknown,
  label: string,
  min: number,
  max: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new DomainError(`${label} must be a number.`);
  }

  if (value < min || value > max) {
    throw new DomainError(`${label} is out of range.`);
  }

  return value;
}

function normalizeInteger(
  value: unknown,
  label: string,
  min: number,
  max: number,
): number {
  const numberValue = normalizeFiniteNumber(value, label, min, max);

  if (!Number.isInteger(numberValue)) {
    throw new DomainError(`${label} must be an integer.`);
  }

  return numberValue;
}

function normalizeBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new DomainError(`${label} must be a boolean.`);
  }

  return value;
}

function cloneJsonObject(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new DomainError('Journal object props must be an object.');
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    throw new DomainError('Journal object props must be JSON serializable.');
  }
}

function ensureDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be a valid date.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
