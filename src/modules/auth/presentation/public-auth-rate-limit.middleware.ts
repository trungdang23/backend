import {
  HttpException,
  HttpStatus,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { PublicAuthRateLimitService } from './public-auth-rate-limit.service';
import { resolveClientIp } from './resolve-client-ip';

@Injectable()
export class PublicAuthRateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly publicAuthRateLimitService: PublicAuthRateLimitService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const clientIp = resolveClientIp(request);
    const routePath = (request.originalUrl ?? request.url).split('?')[0];
    const decision = this.publicAuthRateLimitService.consume(
      `${request.method}:${routePath}:${clientIp}`,
    );

    response.setHeader('RateLimit-Limit', decision.limit.toString());
    response.setHeader('RateLimit-Remaining', decision.remaining.toString());
    response.setHeader(
      'RateLimit-Reset',
      decision.resetAtEpochSeconds.toString(),
    );

    if (decision.allowed) {
      next();
      return;
    }

    response.setHeader('Retry-After', decision.retryAfterSeconds.toString());

    next(
      new HttpException(
        {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many auth requests. Please retry later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  }
}
