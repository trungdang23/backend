import {
  CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize } from 'rxjs/operators';
import type { Observable } from 'rxjs';

import { AppLogger } from './app-logger.service';
import { buildHttpRequestLogMetadata } from './build-http-request-log-metadata';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLogger,
    private readonly requestContextService: RequestContextService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const duration = Date.now() - startedAt;
        const requestContext = this.requestContextService.getContext();

        this.logger.logWithMetadata(
          'Request completed',
          {
            actorId: requestContext?.actorId,
            correlationId: requestContext?.correlationId,
            request: buildHttpRequestLogMetadata(request),
            response: {
              durationMs: duration,
              statusCode: response.statusCode,
            },
          },
          RequestLoggingInterceptor.name,
        );
      }),
    );
  }
}
