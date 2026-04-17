import { BadRequestException } from '@nestjs/common';

import { DomainError } from '../../../../shared/domain/domain-error';

export function rethrowItineraryDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw new BadRequestException(error.message);
  }

  throw error;
}
