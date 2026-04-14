import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';

import { AppConfigService } from '../config/app-config.service';
import { HttpExceptionFilter } from '../errors/http-exception.filter';
import { ApiResponseInterceptor } from '../http/api-response.interceptor';
import { AppLogger } from '../logging/app-logger.service';
import { RequestLoggingInterceptor } from '../logging/request-logging.interceptor';
import { RequestContextMiddleware } from '../request-context/request-context.middleware';
import { RequestContextService } from '../request-context/request-context.service';

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

export function setupApp(app: INestApplication): void {
  const config = app.get(AppConfigService);
  const logger = app.get(AppLogger);
  const requestContextService = app.get(RequestContextService);
  const requestContextMiddleware = app.get(RequestContextMiddleware);

  app.setGlobalPrefix(config.globalPrefix);
  app.use((request: Request, response: Response, next: NextFunction) => {
    requestContextMiddleware.use(request, response, next);
  });
  app.enableCors({
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Correlation-Id'],
    exposedHeaders: [
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
      'Retry-After',
      'X-Correlation-Id',
    ],
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    optionsSuccessStatus: 204,
    origin(origin: string | undefined, callback: CorsOriginCallback) {
      if (origin === undefined) {
        callback(null, true);
        return;
      }

      callback(null, config.corsAllowedOrigins.includes(origin));
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(logger, requestContextService),
    new ApiResponseInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter(logger, requestContextService));

  if (config.swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Journey API')
      .setDescription('Backend API for the Journey platform.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${config.globalPrefix}/docs`, app, document);
  }
}
