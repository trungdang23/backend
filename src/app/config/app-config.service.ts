import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig, NodeEnvironment } from './app-config';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<ApplicationConfig, true>,
  ) {}

  get appName(): string {
    return this.configService.get('app.name', { infer: true });
  }

  get nodeEnv(): NodeEnvironment {
    return this.configService.get('app.nodeEnv', { infer: true });
  }

  get port(): number {
    return this.configService.get('app.port', { infer: true });
  }

  get globalPrefix(): string {
    return this.configService.get('app.globalPrefix', { infer: true });
  }

  get appReleaseSha(): string | null {
    return this.configService.get('app.releaseSha', { infer: true });
  }

  get swaggerEnabled(): boolean {
    return this.configService.get('app.swaggerEnabled', { infer: true });
  }

  get swaggerUsername(): string | null {
    return this.configService.get('app.swaggerUsername', { infer: true });
  }

  get swaggerPassword(): string | null {
    return this.configService.get('app.swaggerPassword', { infer: true });
  }

  get corsAllowedOrigins(): string[] {
    return this.configService.get('app.corsAllowedOrigins', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('database.url', { infer: true });
  }

  get jwtIssuer(): string {
    return this.configService.get('auth.jwtIssuer', { infer: true });
  }

  get jwtAccessTokenSecret(): string {
    return this.configService.get('auth.accessTokenSecret', { infer: true });
  }

  get jwtAccessTokenTtl(): string {
    return this.configService.get('auth.accessTokenTtl', { infer: true });
  }

  get jwtRefreshTokenSecret(): string {
    return this.configService.get('auth.refreshTokenSecret', { infer: true });
  }

  get jwtRefreshTokenTtl(): string {
    return this.configService.get('auth.refreshTokenTtl', { infer: true });
  }

  get authRateLimitMaxRequests(): number {
    return this.configService.get('auth.rateLimitMaxRequests', { infer: true });
  }

  get authRateLimitWindowSeconds(): number {
    return this.configService.get('auth.rateLimitWindowSeconds', {
      infer: true,
    });
  }

  get journalAssetStorageDir(): string | null {
    return this.configService.get('journalAssets.storageDir', { infer: true });
  }

  get journalAssetSigningSecret(): string {
    return this.configService.get('journalAssets.signingSecret', {
      infer: true,
    });
  }

  get journalAssetSignedUrlTtlSeconds(): number {
    return this.configService.get('journalAssets.signedUrlTtlSeconds', {
      infer: true,
    });
  }

  get userAvatarStorageDir(): string | null {
    return this.configService.get('userAvatars.storageDir', { infer: true });
  }
}
