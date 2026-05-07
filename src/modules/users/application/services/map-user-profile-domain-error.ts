import { userProfileValidationException } from '../../../../app/errors/app-exceptions';
import { DomainError } from '../../../../shared/domain/domain-error';

export function rethrowUserProfileDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw userProfileValidationException(error.message);
  }

  throw error;
}
