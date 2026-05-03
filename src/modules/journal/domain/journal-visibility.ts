import { DomainError } from '../../../shared/domain/domain-error';

export const JOURNAL_VISIBILITIES = ['private', 'unlisted', 'public'] as const;

export type JournalVisibility = (typeof JOURNAL_VISIBILITIES)[number];

export const DEFAULT_JOURNAL_VISIBILITY: JournalVisibility = 'private';

export const PUBLICLY_READABLE_JOURNAL_VISIBILITIES: readonly JournalVisibility[] =
  ['unlisted', 'public'];

export function normalizeJournalVisibility(
  value: string | undefined,
): JournalVisibility {
  if (value === undefined) {
    return DEFAULT_JOURNAL_VISIBILITY;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (JOURNAL_VISIBILITIES.includes(normalizedValue as JournalVisibility)) {
    return normalizedValue as JournalVisibility;
  }

  throw new DomainError(
    'Journal visibility must be private, unlisted, or public.',
  );
}

export function isJournalPubliclyReadable(
  visibility: JournalVisibility,
): boolean {
  return PUBLICLY_READABLE_JOURNAL_VISIBILITIES.includes(visibility);
}
