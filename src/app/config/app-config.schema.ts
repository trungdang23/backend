import Joi from 'joi';

export const appConfigSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  APP_NAME: Joi.string().default('journey-backend'),
  APP_PORT: Joi.number().port().default(3001),
  GLOBAL_PREFIX: Joi.string().default('api/v1'),
  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_USERNAME: Joi.string().allow('').default(''),
  SWAGGER_PASSWORD: Joi.string().allow('').default(''),
  CORS_ALLOWED_ORIGINS: Joi.string().allow('').default(''),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  JWT_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_TOKEN_TTL: Joi.string().default('7d'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .empty('')
    .default(10),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: Joi.number()
    .integer()
    .min(1)
    .empty('')
    .default(60),
  JOURNAL_ASSET_STORAGE_DIR: Joi.string().allow('').default(''),
});
