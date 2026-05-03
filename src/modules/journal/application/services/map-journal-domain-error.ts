import { journalValidationException } from '../../../../app/errors/app-exceptions';
import { DomainError } from '../../../../shared/domain/domain-error';

export function rethrowJournalDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw journalValidationException(error.message);
  }

  throw error;
}
