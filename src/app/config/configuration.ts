import type { ApplicationConfig, NodeEnvironment } from './app-config';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
}

function parseStringList(value: string | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(
      (entry, index, entries) =>
        entry.length > 0 && entries.indexOf(entry) === index,
    );
}

function parseOptionalString(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? null : normalized;
}

function parseInteger(value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function parsePort(value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export function configuration(): ApplicationConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as NodeEnvironment;

  return {
    app: {
      name: process.env.APP_NAME ?? 'journey-backend',
      nodeEnv,
      port: parsePort(process.env.APP_PORT, 3001),
      globalPrefix: process.env.GLOBAL_PREFIX ?? 'api/v1',
      swaggerEnabled: parseBoolean(process.env.SWAGGER_ENABLED, true),
      swaggerUsername: parseOptionalString(process.env.SWAGGER_USERNAME),
      swaggerPassword: parseOptionalString(process.env.SWAGGER_PASSWORD),
      corsAllowedOrigins: parseStringList(process.env.CORS_ALLOWED_ORIGINS),
    },
    database: {
      url: requireEnv('DATABASE_URL'),
    },
    auth: {
      jwtIssuer: requireEnv('JWT_ISSUER'),
      accessTokenSecret: requireEnv('JWT_ACCESS_TOKEN_SECRET'),
      accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL ?? '15m',
      refreshTokenSecret: requireEnv('JWT_REFRESH_TOKEN_SECRET'),
      refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL ?? '7d',
      rateLimitMaxRequests: parseInteger(
        process.env.AUTH_RATE_LIMIT_MAX_REQUESTS,
        10,
      ),
      rateLimitWindowSeconds: parseInteger(
        process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS,
        60,
      ),
    },
    journalAssets: {
      storageDir: parseOptionalString(process.env.JOURNAL_ASSET_STORAGE_DIR),
    },
  };
}
