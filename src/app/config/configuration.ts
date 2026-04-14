import type { ApplicationConfig, NodeEnvironment } from './app-config';

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
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
    },
    database: {
      url:
        process.env.DATABASE_URL ??
        'postgresql://journey:journey@localhost:5432/journey?schema=public',
    },
    auth: {
      jwtIssuer: process.env.JWT_ISSUER ?? 'journey.local',
      accessTokenSecret:
        process.env.JWT_ACCESS_TOKEN_SECRET ??
        'journey-local-access-token-secret-change-me',
      accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL ?? '15m',
      refreshTokenSecret:
        process.env.JWT_REFRESH_TOKEN_SECRET ??
        'journey-local-refresh-token-secret-change-me',
      refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL ?? '7d',
    },
  };
}
