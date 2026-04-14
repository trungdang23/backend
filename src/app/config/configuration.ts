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
      url: requireEnv('DATABASE_URL'),
    },
    auth: {
      jwtIssuer: requireEnv('JWT_ISSUER'),
      accessTokenSecret: requireEnv('JWT_ACCESS_TOKEN_SECRET'),
      accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL ?? '15m',
      refreshTokenSecret: requireEnv('JWT_REFRESH_TOKEN_SECRET'),
      refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL ?? '7d',
    },
  };
}
