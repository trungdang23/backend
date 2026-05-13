import { EventEmitter } from 'node:events';

import type { Express } from 'express';
import { createRequest, createResponse } from 'node-mocks-http';

export interface DispatchRequestOptions {
  headers?: Record<string, string>;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
}

export interface DispatchRequestResult {
  body: unknown;
  headers: Record<string, number | string | string[] | undefined>;
  statusCode: number;
}

function parseResponseBody(
  rawBody: string,
  headers: DispatchRequestResult['headers'],
): unknown {
  if (rawBody.length === 0) {
    return undefined;
  }

  const contentTypeHeader =
    headers['content-type'] ??
    headers['Content-Type'] ??
    headers['CONTENT-TYPE'];
  const contentType = Array.isArray(contentTypeHeader)
    ? contentTypeHeader[0]
    : contentTypeHeader;

  if (typeof contentType === 'string' && contentType.includes('application/json')) {
    return JSON.parse(rawBody);
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
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
    const headers = { ...options.headers };

    if (options.body !== undefined && headers['content-type'] === undefined) {
      headers['content-type'] = 'application/json';
    }

    const request = createRequest({
      headers,
      method: options.method,
      originalUrl: options.path,
      url: options.path,
      body: options.body as Record<string, unknown> | undefined,
    });
    if (options.body !== undefined && options.body !== null) {
      request.body = options.body as Record<string, unknown>;
      request._setBody?.(options.body as Record<string, unknown>);
    }
    const response = createResponse({
      eventEmitter: EventEmitter,
    });

    response.on('end', () => {
      const responseHeaders =
        response._getHeaders() as DispatchRequestResult['headers'];
      const rawBody = response._getData() as string;

      resolve({
        body: parseResponseBody(rawBody, responseHeaders),
        headers: responseHeaders,
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
