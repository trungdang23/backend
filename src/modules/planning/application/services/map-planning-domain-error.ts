import { nodeValidationException } from '../../../../app/errors/app-exceptions';
import { DomainError } from '../../../../shared/domain/domain-error';

export function rethrowPlanningDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw nodeValidationException(error.message);
  }

  throw error;
}
