process.env.NODE_ENV ??= 'test';
process.env.APP_NAME ??= 'journey-backend';
process.env.APP_PORT ??= '3101';
process.env.GLOBAL_PREFIX ??= 'api/v1';
process.env.SWAGGER_ENABLED ??= 'false';
process.env.SWAGGER_USERNAME ??= '';
process.env.SWAGGER_PASSWORD ??= '';
process.env.CORS_ALLOWED_ORIGINS ??= 'http://localhost:3000';
process.env.DATABASE_URL ??=
  'postgresql://journey:journey@localhost:5432/journey_test?schema=public';
process.env.JWT_ISSUER ??= 'journey.test';
process.env.JWT_ACCESS_TOKEN_SECRET ??=
  'journey-test-access-token-secret-123456789';
process.env.JWT_ACCESS_TOKEN_TTL ??= '15m';
process.env.JWT_REFRESH_TOKEN_SECRET ??=
  'journey-test-refresh-token-secret-123456789';
process.env.JWT_REFRESH_TOKEN_TTL ??= '7d';
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS ??= '100';
process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS ??= '60';
