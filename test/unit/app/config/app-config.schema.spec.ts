import { appConfigSchema } from '../../../../src/app/config/app-config.schema';

describe('appConfigSchema', () => {
  it('falls back to default auth rate limit values when runtime env is blank', () => {
    const result = appConfigSchema.validate({
      APP_NAME: 'journey-backend',
      APP_PORT: '3001',
      AUTH_RATE_LIMIT_MAX_REQUESTS: '',
      AUTH_RATE_LIMIT_WINDOW_SECONDS: '',
      CORS_ALLOWED_ORIGINS: '',
      DATABASE_URL:
        'postgresql://journey:journey@localhost:5432/journey?schema=public',
      GLOBAL_PREFIX: 'api/v1',
      JOURNAL_ASSET_SIGNED_URL_TTL_SECONDS: '',
      JOURNAL_ASSET_SIGNING_SECRET:
        'journey-test-journal-asset-signing-secret-123456789',
      JWT_ACCESS_TOKEN_SECRET: 'journey-test-access-token-secret-123456789',
      JWT_ISSUER: 'api.buicojourney.com',
      JWT_REFRESH_TOKEN_SECRET: 'journey-test-refresh-token-secret-123456789',
      NODE_ENV: 'production',
      SWAGGER_ENABLED: 'false',
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      AUTH_RATE_LIMIT_MAX_REQUESTS: 10,
      AUTH_RATE_LIMIT_WINDOW_SECONDS: 60,
      APP_RELEASE_SHA: '',
      JOURNAL_ASSET_SIGNED_URL_TTL_SECONDS: 900,
    });
  });
});
