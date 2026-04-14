import { Buffer } from 'node:buffer';
import { timingSafeEqual } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

interface SwaggerBasicAuthOptions {
  password: string;
  username: string;
}

interface BasicAuthCredentials {
  password: string;
  username: string;
}

function parseBasicAuthCredentials(
  authorizationHeader: string | undefined,
): BasicAuthCredentials | null {
  if (authorizationHeader === undefined) {
    return null;
  }

  const [scheme, encodedCredentials] = authorizationHeader.split(' ');

  if (
    scheme !== 'Basic' ||
    encodedCredentials === undefined ||
    encodedCredentials.length === 0
  ) {
    return null;
  }

  try {
    const decodedCredentials = Buffer.from(
      encodedCredentials,
      'base64',
    ).toString('utf8');
    const separatorIndex = decodedCredentials.indexOf(':');

    if (separatorIndex < 0) {
      return null;
    }

    return {
      password: decodedCredentials.slice(separatorIndex + 1),
      username: decodedCredentials.slice(0, separatorIndex),
    };
  } catch {
    return null;
  }
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSwaggerBasicAuthMiddleware(
  options: SwaggerBasicAuthOptions,
) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const credentials = parseBasicAuthCredentials(
      request.headers.authorization,
    );

    if (
      credentials !== null &&
      safeEquals(credentials.username, options.username) &&
      safeEquals(credentials.password, options.password)
    ) {
      next();
      return;
    }

    response.setHeader('WWW-Authenticate', 'Basic realm="Journey API Docs"');
    response.status(401).send('Authentication required.');
  };
}
