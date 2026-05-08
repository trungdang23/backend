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
    process.env.APP_RELEASE_SHA = '9da357cb35912eedf2f5044c98754b7895cea53b';
    process.env.SWAGGER_ENABLED = 'false';
    process.env.SWAGGER_USERNAME = 'docs-user';
    process.env.SWAGGER_PASSWORD = 'docs-password';
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
    process.env.JOURNAL_ASSET_SIGNING_SECRET =
      'journey-production-journal-asset-signing-secret-123456789';
    process.env.JOURNAL_ASSET_SIGNED_URL_TTL_SECONDS = '1800';

    expect(configuration()).toEqual({
      app: {
        name: 'journey-api',
        nodeEnv: 'production',
        port: 8080,
        globalPrefix: 'api/v1',
        releaseSha: '9da357cb35912eedf2f5044c98754b7895cea53b',
        swaggerEnabled: false,
        swaggerUsername: 'docs-user',
        swaggerPassword: 'docs-password',
        corsAllowedOrigins: [
          'https://buicojourney.com',
          'https://www.buicojourney.com',
        ],
      },
      database: {
        url: 'postgresql://journey:journey@localhost:5432/journey_prod?schema=public',
      },
      journalAssets: {
        storageDir: null,
        signingSecret:
          'journey-production-journal-asset-signing-secret-123456789',
        signedUrlTtlSeconds: 1800,
      },
      userAvatars: {
        storageDir: null,
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

  it('normalizes blank release sha env to null', () => {
    process.env.DATABASE_URL =
      'postgresql://journey:journey@localhost:5432/journey_prod?schema=public';
    process.env.JWT_ISSUER = 'api.buicojourney.com';
    process.env.JWT_ACCESS_TOKEN_SECRET =
      'journey-production-access-token-secret-123456789';
    process.env.JWT_REFRESH_TOKEN_SECRET =
      'journey-production-refresh-token-secret-123456789';
    process.env.JOURNAL_ASSET_SIGNING_SECRET =
      'journey-production-journal-asset-signing-secret-123456789';
    process.env.APP_RELEASE_SHA = '   ';

    expect(configuration().app.releaseSha).toBeNull();
  });

  it('throws when required runtime env is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => configuration()).toThrow(
      'Missing required environment variable: DATABASE_URL',
    );
  });

  it('throws when required journal asset signing secret env is missing', () => {
    process.env.DATABASE_URL =
      'postgresql://journey:journey@localhost:5432/journey_prod?schema=public';
    process.env.JWT_ISSUER = 'api.buicojourney.com';
    process.env.JWT_ACCESS_TOKEN_SECRET =
      'journey-production-access-token-secret-123456789';
    process.env.JWT_REFRESH_TOKEN_SECRET =
      'journey-production-refresh-token-secret-123456789';
    delete process.env.JOURNAL_ASSET_SIGNING_SECRET;

    expect(() => configuration()).toThrow(
      'Missing required environment variable: JOURNAL_ASSET_SIGNING_SECRET',
    );
  });
});
