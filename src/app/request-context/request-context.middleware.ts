import { Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { CORRELATION_ID_HEADER } from './request-context';
import { RequestContextService } from './request-context.service';
import { resolveCorrelationId } from './resolve-correlation-id';

@Injectable()
export class RequestContextMiddleware {
  constructor(private readonly requestContextService: RequestContextService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const correlationId = resolveCorrelationId(
      request.headers[CORRELATION_ID_HEADER],
    );

    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    this.requestContextService.run(
      {
        correlationId,
        requestMethod: request.method,
        requestPath: request.originalUrl ?? request.url,
      },
      () => {
        next();
      },
    );
  }
}
