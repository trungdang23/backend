import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { buildHttpRequestLogMetadata } from '../logging/build-http-request-log-metadata';
import { buildErrorResponse } from '../http/api-response';
import { AppLogger } from '../logging/app-logger.service';
import { sanitizeLogData } from '../logging/sanitize-log-data';
import { RequestContextService } from '../request-context/request-context.service';

type ExceptionResponseBody = {
  code?: string;
  message?: string | string[];
  errors?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLogger,
    private readonly requestContextService: RequestContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    let statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus() as HttpStatus;

      const exceptionResponse = exception.getResponse() as
        | string
        | ExceptionResponseBody;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const rawMessage = exceptionResponse.message ?? exception.message;

        message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
        code = exceptionResponse.code ?? this.resolveErrorCode(statusCode);
        details = exceptionResponse.errors ?? exceptionResponse.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const requestContext = this.requestContextService.getContext();
    const logMetadata = sanitizeLogData({
      actorId: requestContext?.actorId,
      code,
      correlationId: requestContext?.correlationId,
      details,
      message,
      request: buildHttpRequestLogMetadata(request),
      statusCode,
    });

    this.logger.errorWithMetadata(
      'Request failed',
      exception instanceof Error ? exception.stack : undefined,
      logMetadata,
      HttpExceptionFilter.name,
    );

    response
      .status(statusCode)
      .json(
        buildErrorResponse({
          code,
          details,
          message,
          path: request.url,
        }),
      );
  }

  private resolveErrorCode(statusCode: HttpStatus): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      default:
        return 'HTTP_ERROR';
    }
  }
}
