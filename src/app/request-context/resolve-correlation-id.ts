import { randomUUID } from 'node:crypto';

export function resolveCorrelationId(
  headerValue: string | string[] | undefined,
): string {
  if (Array.isArray(headerValue)) {
    const firstNonEmptyValue = headerValue.find(
      (value) => value.trim().length > 0,
    );

    return firstNonEmptyValue ?? randomUUID();
  }

  if (headerValue !== undefined && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  return randomUUID();
}
