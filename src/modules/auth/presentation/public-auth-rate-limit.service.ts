import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '../../../app/config/app-config';

export interface AuthRateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtEpochSeconds: number;
  retryAfterSeconds: number;
}

interface AuthRateLimitBucket {
  requestCount: number;
  resetAtEpochMilliseconds: number;
}

@Injectable()
export class PublicAuthRateLimitService {
  private readonly buckets = new Map<string, AuthRateLimitBucket>();

  constructor(
    private readonly configService: ConfigService<ApplicationConfig, true>,
  ) {}

  consume(
    key: string,
    nowEpochMilliseconds = Date.now(),
  ): AuthRateLimitDecision {
    this.pruneExpiredBuckets(nowEpochMilliseconds);

    const limit = this.configService.get('auth.rateLimitMaxRequests', {
      infer: true,
    });
    const windowMilliseconds =
      this.configService.get('auth.rateLimitWindowSeconds', {
        infer: true,
      }) * 1000;
    const existingBucket = this.buckets.get(key);
    const bucket =
      existingBucket === undefined ||
      existingBucket.resetAtEpochMilliseconds <= nowEpochMilliseconds
        ? {
            requestCount: 0,
            resetAtEpochMilliseconds: nowEpochMilliseconds + windowMilliseconds,
          }
        : existingBucket;

    this.buckets.set(key, bucket);

    if (bucket.requestCount >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAtEpochSeconds: Math.ceil(bucket.resetAtEpochMilliseconds / 1000),
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(
            (bucket.resetAtEpochMilliseconds - nowEpochMilliseconds) / 1000,
          ),
        ),
      };
    }

    bucket.requestCount += 1;

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - bucket.requestCount),
      resetAtEpochSeconds: Math.ceil(bucket.resetAtEpochMilliseconds / 1000),
      retryAfterSeconds: 0,
    };
  }

  reset(): void {
    this.buckets.clear();
  }

  private pruneExpiredBuckets(nowEpochMilliseconds: number): void {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAtEpochMilliseconds <= nowEpochMilliseconds) {
        this.buckets.delete(key);
      }
    }
  }
}
