import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpStatus } from '@nestjs/common';

import { HttpExceptionFilter } from '../../../../src/app/errors/http-exception.filter';
import type { AppLogger } from '../../../../src/app/logging/app-logger.service';
import type { RequestContextService } from '../../../../src/app/request-context/request-context.service';

describe('HttpExceptionFilter', () => {
  it('maps Nest HTTP exceptions to the shared error envelope', () => {
    type ResponseStub = {
      status: jest.MockedFunction<(code: number) => ResponseStub>;
      json: jest.MockedFunction<(payload: unknown) => void>;
    };

    const response: ResponseStub = {
      status: jest.fn(),
      json: jest.fn(),
    };

    response.status.mockReturnValue(response);

    const logger = {
      errorWithMetadata: jest.fn(),
    } as unknown as AppLogger;
    const requestContextService = {
      getContext: jest.fn().mockReturnValue({
        correlationId: 'journey-correlation-id',
      }),
    } as unknown as RequestContextService;
    const filter = new HttpExceptionFilter(logger, requestContextService);
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/api/v1/trips',
        }),
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    filter.catch(
      new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Payload is invalid',
        errors: {
          field: 'name',
        },
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const [payload] = response.json.mock.calls[0] as [unknown];
    const body = payload as {
      success: boolean;
      error: {
        code: string;
        message: string;
        path: string;
      };
    };

    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(body.error.message).toBe('Payload is invalid');
    expect(body.error.path).toBe('/api/v1/trips');
  });
});
