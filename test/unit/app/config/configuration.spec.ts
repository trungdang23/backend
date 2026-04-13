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
    process.env.DATABASE_URL =
      'postgresql://journey:journey@localhost:5432/journey_prod?schema=public';
    process.env.JWT_ISSUER = 'api.tenmiencuaban.com';
    process.env.JWT_ACCESS_TOKEN_TTL = '10m';
    process.env.JWT_REFRESH_TOKEN_TTL = '14d';

    expect(configuration()).toEqual({
      app: {
        name: 'journey-api',
        nodeEnv: 'production',
        port: 8080,
        globalPrefix: 'api/v1',
        swaggerEnabled: false,
      },
      database: {
        url: 'postgresql://journey:journey@localhost:5432/journey_prod?schema=public',
      },
      auth: {
        jwtIssuer: 'api.tenmiencuaban.com',
        accessTokenTtl: '10m',
        refreshTokenTtl: '14d',
      },
    });
  });
});
