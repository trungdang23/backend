import { EventEmitter } from 'node:events';

import type { Express } from 'express';
import { createRequest, createResponse } from 'node-mocks-http';

export interface DispatchRequestOptions {
  headers?: Record<string, string>;
  method: 'GET' | 'POST';
  path: string;
}

export interface DispatchRequestResult {
  body: unknown;
  headers: Record<string, number | string | string[] | undefined>;
  statusCode: number;
}

function resolveDispatchErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown dispatch error';
}

export async function dispatchRequest(
  expressApp: Express,
  options: DispatchRequestOptions,
): Promise<DispatchRequestResult> {
  return await new Promise((resolve, reject) => {
    const request = createRequest({
      headers: options.headers,
      method: options.method,
      originalUrl: options.path,
      url: options.path,
    });
    const response = createResponse({
      eventEmitter: EventEmitter,
    });

    response.on('end', () => {
      resolve({
        body: response._getJSONData() as unknown,
        headers: response._getHeaders() as DispatchRequestResult['headers'],
        statusCode: response.statusCode,
      });
    });

    expressApp(request, response, (error?: unknown) => {
      if (error === undefined) {
        return;
      }

      reject(
        error instanceof Error
          ? error
          : new Error(resolveDispatchErrorMessage(error)),
      );
    });
  });
}
