import { configuration } from '../../../../src/app/config/configuration';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds typed config from environment values', () => {
    process.env.NODE_ENV = 'production';
    process.env.APP_NAME = 'journey-api';
    process.env.APP_PORT = '8080';
    process.env.GLOBAL_PREFIX = 'api/v1';
    process.env.SWAGGER_ENABLED = 'false';
    process.env.CORS_ALLOWED_ORIGINS =
      'https://buicojourney.com, https://www.buicojourney.com';
    process.env.DATABASE_URL =
      'postgresql://journey:journey@localhost:5432/journey_prod?schema=public';
    process.env.JWT_ISSUER = 'api.buicojourney.com';
    process.env.JWT_ACCESS_TOKEN_SECRET =
      'journey-production-access-token-secret-123456789';
    process.env.JWT_ACCESS_TOKEN_TTL = '10m';
    process.env.JWT_REFRESH_TOKEN_SECRET =
      'journey-production-refresh-token-secret-123456789';
    process.env.JWT_REFRESH_TOKEN_TTL = '14d';
    process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '12';
    process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS = '90';

    expect(configuration()).toEqual({
      app: {
        name: 'journey-api',
        nodeEnv: 'production',
        port: 8080,
        globalPrefix: 'api/v1',
        swaggerEnabled: false,
        corsAllowedOrigins: [
          'https://buicojourney.com',
          'https://www.buicojourney.com',
        ],
      },
      database: {
        url: 'postgresql://journey:journey@localhost:5432/journey_prod?schema=public',
      },
      auth: {
        jwtIssuer: 'api.buicojourney.com',
        accessTokenSecret: 'journey-production-access-token-secret-123456789',
        accessTokenTtl: '10m',
        refreshTokenSecret: 'journey-production-refresh-token-secret-123456789',
        refreshTokenTtl: '14d',
        rateLimitMaxRequests: 12,
        rateLimitWindowSeconds: 90,
      },
    });
  });

  it('throws when required runtime env is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => configuration()).toThrow(
      'Missing required environment variable: DATABASE_URL',
    );
  });
});
