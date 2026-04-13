const REDACTED_VALUE = '[REDACTED]';

const SENSITIVE_KEY_PATTERNS = [
  /access[-_]?token/i,
  /api[-_]?key/i,
  /authorization/i,
  /cookie/i,
  /password/i,
  /refresh[-_]?token/i,
  /secret/i,
  /set-cookie/i,
  /token/i,
];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function sanitizeLogData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogData(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => {
        if (isSensitiveKey(key)) {
          return [key, REDACTED_VALUE];
        }

        return [key, sanitizeLogData(nestedValue)];
      }),
    );
  }

  return value;
}
