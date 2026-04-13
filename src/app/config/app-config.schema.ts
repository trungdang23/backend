import Joi from 'joi';

export const appConfigSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  APP_NAME: Joi.string().default('journey-backend'),
  APP_PORT: Joi.number().port().default(3001),
  GLOBAL_PREFIX: Joi.string().default('api/v1'),
  SWAGGER_ENABLED: Joi.boolean().default(true),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  JWT_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: Joi.string().default('7d'),
});
