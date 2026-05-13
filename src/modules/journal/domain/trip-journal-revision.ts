import { DomainError } from '../../../shared/domain/domain-error';
import type { JournalPage, JournalSceneObject, TripJournal } from './trip-journal';

export interface TripJournalRevisionInput {
  id?: string | null;
  tripId: string;
  sceneVersion: number;
  page: JournalPage;
  objects: JournalSceneObject[];
  createdAt?: Date;
}

interface TripJournalRevisionProps {
  id: string | null;
  tripId: string;
  sceneVersion: number;
  page: JournalPage;
  objects: JournalSceneObject[];
  createdAt: Date;
}

export class TripJournalRevision {
  private constructor(private readonly props: TripJournalRevisionProps) {}

  static create(input: TripJournalRevisionInput): TripJournalRevision {
    return new TripJournalRevision({
      id: normalizeOptionalIdentifier(input.id, 'Journal revision id'),
      tripId: normalizeIdentifier(input.tripId, 'Trip id'),
      sceneVersion: normalizeSceneVersion(input.sceneVersion),
      page: input.page,
      objects: input.objects,
      createdAt: ensureDate(input.createdAt ?? new Date(), 'Created at'),
    });
  }

  static fromJournal(journal: TripJournal): TripJournalRevision {
    return TripJournalRevision.create({
      tripId: journal.tripId,
      sceneVersion: journal.sceneVersion,
      page: journal.page,
      objects: journal.objects,
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

  get objectCount(): number {
    return this.props.objects.length;
  }

  get createdAt(): Date {
    return this.props.createdAt;
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

function normalizeSceneVersion(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new DomainError('Journal revision scene version is invalid.');
  }

  return value;
}

function ensureDate(value: Date, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} is invalid.`);
  }

  return value;
}
