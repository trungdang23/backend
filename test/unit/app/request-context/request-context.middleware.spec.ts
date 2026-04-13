import type { NextFunction, Request, Response } from 'express';

import { CORRELATION_ID_HEADER } from '../../../../src/app/request-context/request-context';
import { RequestContextMiddleware } from '../../../../src/app/request-context/request-context.middleware';
import { RequestContextService } from '../../../../src/app/request-context/request-context.service';

describe('RequestContextMiddleware', () => {
  it('uses an incoming correlation id and exposes it through the request context', () => {
    const requestContextService = new RequestContextService();
    const middleware = new RequestContextMiddleware(requestContextService);
    const setHeader = jest.fn();
    const next = jest.fn(() => {
      expect(requestContextService.getContext()).toEqual({
        correlationId: 'journey-correlation-id',
        requestMethod: 'GET',
        requestPath: '/api/v1/health',
      });
    });
    const response = {
      setHeader,
    } as unknown as Response;

    middleware.use(
      {
        headers: {
          [CORRELATION_ID_HEADER]: 'journey-correlation-id',
        },
        method: 'GET',
        originalUrl: '/api/v1/health',
        url: '/api/v1/health',
      } as unknown as Request,
      response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      'journey-correlation-id',
    );
  });

  it('generates a correlation id when the request does not provide one', () => {
    const middleware = new RequestContextMiddleware(new RequestContextService());
    const setHeader = jest.fn();
    const response = {
      setHeader,
    } as unknown as Response;

    middleware.use(
      {
        headers: {},
        method: 'GET',
        originalUrl: '/api/v1/health',
        url: '/api/v1/health',
      } as unknown as Request,
      response,
      jest.fn() as NextFunction,
    );

    expect(setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_HEADER,
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    );
  });
});
