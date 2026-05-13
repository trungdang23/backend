import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export const APP_ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  JOURNAL_ASSET_NOT_FOUND: 'JOURNAL_ASSET_NOT_FOUND',
  JOURNAL_REVISION_NOT_FOUND: 'JOURNAL_REVISION_NOT_FOUND',
  JOURNAL_VALIDATION_ERROR: 'JOURNAL_VALIDATION_ERROR',
  NODE_VALIDATION_ERROR: 'NODE_VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TRIP_NOT_FOUND: 'TRIP_NOT_FOUND',
  USER_AVATAR_NOT_FOUND: 'USER_AVATAR_NOT_FOUND',
  USER_PROFILE_VALIDATION_ERROR: 'USER_PROFILE_VALIDATION_ERROR',
} as const;

type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

function buildExceptionBody(code: AppErrorCode, message: string) {
  return {
    code,
    message,
  };
}

export function authInvalidCredentialsException() {
  return new UnauthorizedException(
    buildExceptionBody(
      APP_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      'Invalid email or password.',
    ),
  );
}

export function authTokenExpiredException(message = 'Token has expired.') {
  return new UnauthorizedException(
    buildExceptionBody(APP_ERROR_CODES.AUTH_TOKEN_EXPIRED, message),
  );
}

export function nodeValidationException(message: string) {
  return new BadRequestException(
    buildExceptionBody(APP_ERROR_CODES.NODE_VALIDATION_ERROR, message),
  );
}

export function journalValidationException(message: string) {
  return new BadRequestException(
    buildExceptionBody(APP_ERROR_CODES.JOURNAL_VALIDATION_ERROR, message),
  );
}

export function journalAssetNotFoundException(
  message = 'Journal asset not found.',
) {
  return new NotFoundException(
    buildExceptionBody(APP_ERROR_CODES.JOURNAL_ASSET_NOT_FOUND, message),
  );
}

export function journalRevisionNotFoundException(
  message = 'Journal revision not found.',
) {
  return new NotFoundException(
    buildExceptionBody(APP_ERROR_CODES.JOURNAL_REVISION_NOT_FOUND, message),
  );
}

export function permissionDeniedException(message = 'Permission denied.') {
  return new ForbiddenException(
    buildExceptionBody(APP_ERROR_CODES.PERMISSION_DENIED, message),
  );
}

export function tripNotFoundException(message = 'Trip not found.') {
  return new NotFoundException(
    buildExceptionBody(APP_ERROR_CODES.TRIP_NOT_FOUND, message),
  );
}

export function userAvatarNotFoundException(
  message = 'User avatar not found.',
) {
  return new NotFoundException(
    buildExceptionBody(APP_ERROR_CODES.USER_AVATAR_NOT_FOUND, message),
  );
}

export function userProfileValidationException(message: string) {
  return new BadRequestException(
    buildExceptionBody(APP_ERROR_CODES.USER_PROFILE_VALIDATION_ERROR, message),
  );
}
