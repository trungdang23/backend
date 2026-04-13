import type { Request } from 'express';

import { CORRELATION_ID_HEADER } from '../request-context/request-context';
import { sanitizeLogData } from './sanitize-log-data';

type RequestHeadersSubset = {
  authorization?: string | string[];
  cookie?: string | string[];
  'user-agent'?: string | string[];
  [CORRELATION_ID_HEADER]?: string | string[];
};

export function buildHttpRequestLogMetadata(
  request: Pick<
    Request,
    'body' | 'headers' | 'method' | 'originalUrl' | 'params' | 'query' | 'url'
  >,
): Record<string, unknown> {
  const headers = (request.headers ?? {}) as RequestHeadersSubset;
  const requestBody = request.body as unknown;

  return sanitizeLogData({
    body: requestBody,
    headers: {
      authorization: headers.authorization,
      cookie: headers.cookie,
      [CORRELATION_ID_HEADER]: headers[CORRELATION_ID_HEADER],
      'user-agent': headers['user-agent'],
    },
    method: request.method,
    params: request.params,
    path: request.originalUrl ?? request.url,
    query: request.query,
  }) as Record<string, unknown>;
}
