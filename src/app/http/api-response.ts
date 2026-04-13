export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  path?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload & {
    timestamp: string;
  };
}

export function buildSuccessResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): ApiSuccessResponse<T> {
  if (meta === undefined) {
    return {
      success: true,
      data,
    };
  }

  return {
    success: true,
    data,
    meta,
  };
}

export function buildErrorResponse(
  payload: ApiErrorPayload,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      ...payload,
      timestamp: new Date().toISOString(),
    },
  };
}

export function isApiSuccessResponse(
  value: unknown,
): value is ApiSuccessResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    value.success === true &&
    'data' in value
  );
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    value.success === false &&
    'error' in value
  );
}
