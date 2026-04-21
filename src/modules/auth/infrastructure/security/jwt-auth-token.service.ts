import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import type { ApplicationConfig } from '../../../../app/config/app-config';
import type { AuthenticatedUser } from '../../application/authenticated-user';
import type { AuthTokens } from '../../application/auth-tokens';
import type {
  AuthTokenService,
  RefreshTokenSubject,
} from '../../application/ports/auth-token-service.port';
import { RevokedRefreshTokenStore } from './revoked-refresh-token.store';

type TokenKind = 'access' | 'refresh';

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

interface BaseTokenPayload {
  iss: string;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  tokenType: TokenKind;
}

interface AccessTokenPayload extends BaseTokenPayload {
  email?: string;
  roles: string[];
}

type RefreshTokenPayload = BaseTokenPayload;

@Injectable()
export class JwtAuthTokenService implements AuthTokenService {
  private readonly accessTokenLifetimeSeconds: number;
  private readonly refreshTokenLifetimeSeconds: number;
  private readonly revokedRefreshTokenStore: RevokedRefreshTokenStore;

  constructor(
    private readonly configService: ConfigService<ApplicationConfig, true>,
  ) {
    this.accessTokenLifetimeSeconds = this.parseDurationToSeconds(
      this.jwtAccessTokenTtl,
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.refreshTokenLifetimeSeconds = this.parseDurationToSeconds(
      this.jwtRefreshTokenTtl,
      'JWT_REFRESH_TOKEN_TTL',
    );
    this.revokedRefreshTokenStore = new RevokedRefreshTokenStore(
      this.appName,
      this.nodeEnv,
    );
  }

  issueTokens(subject: AuthenticatedUser): Promise<AuthTokens> {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    return Promise.resolve({
      tokenType: 'Bearer',
      accessToken: this.signToken<AccessTokenPayload>(
        {
          email: subject.email,
          exp: nowInSeconds + this.accessTokenLifetimeSeconds,
          iat: nowInSeconds,
          iss: this.jwtIssuer,
          jti: randomUUID(),
          roles: subject.roles,
          sub: subject.userId,
          tokenType: 'access',
        },
        this.jwtAccessTokenSecret,
      ),
      accessTokenExpiresIn: this.accessTokenLifetimeSeconds,
      refreshToken: this.signToken<RefreshTokenPayload>(
        {
          exp: nowInSeconds + this.refreshTokenLifetimeSeconds,
          iat: nowInSeconds,
          iss: this.jwtIssuer,
          jti: randomUUID(),
          sub: subject.userId,
          tokenType: 'refresh',
        },
        this.jwtRefreshTokenSecret,
      ),
      refreshTokenExpiresIn: this.refreshTokenLifetimeSeconds,
    });
  }

  verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    return Promise.resolve().then(() => {
      const payload = this.verifyToken<AccessTokenPayload>(
        accessToken,
        this.jwtAccessTokenSecret,
        'access',
      );

      return {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };
    });
  }

  async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenSubject> {
    const subject = this.parseRefreshToken(refreshToken);
    const isRevoked = await this.revokedRefreshTokenStore.isRevoked(
      subject.tokenId,
    );

    if (isRevoked) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    return subject;
  }

  async revokeRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenSubject> {
    const subject = this.parseRefreshToken(refreshToken);
    const hasConsumedToken = await this.revokedRefreshTokenStore.consume(
      subject.tokenId,
      subject.expiresAt,
    );

    if (!hasConsumedToken) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    return subject;
  }

  private signToken<TPayload extends BaseTokenPayload>(
    payload: TPayload,
    secret: string,
  ): string {
    const header: JwtHeader = {
      alg: 'HS256',
      typ: 'JWT',
    };
    const encodedHeader = this.encodeJson(header);
    const encodedPayload = this.encodeJson(payload);
    const signature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyToken<TPayload extends BaseTokenPayload>(
    token: string,
    secret: string,
    expectedTokenType: TokenKind,
  ): TPayload {
    const tokenParts = token.trim().split('.');

    if (tokenParts.length !== 3) {
      throw new UnauthorizedException('Token is invalid.');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = tokenParts;
    const header = this.decodeJson<JwtHeader>(encodedHeader);
    const payload = this.decodeJson<TPayload>(encodedPayload);

    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new UnauthorizedException('Token is invalid.');
    }

    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );

    if (!this.signaturesMatch(encodedSignature, expectedSignature)) {
      throw new UnauthorizedException('Token is invalid.');
    }

    if (payload.iss !== this.jwtIssuer) {
      throw new UnauthorizedException('Token issuer is invalid.');
    }

    if (payload.tokenType !== expectedTokenType) {
      throw new UnauthorizedException('Token type is invalid.');
    }

    if (
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= payload.iat
    ) {
      throw new UnauthorizedException('Token is invalid.');
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token has expired.');
    }

    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Token subject is invalid.');
    }

    if (!payload.jti || typeof payload.jti !== 'string') {
      throw new UnauthorizedException('Token identifier is invalid.');
    }

    if (expectedTokenType === 'access' && !this.isAccessTokenPayload(payload)) {
      throw new UnauthorizedException('Token roles are invalid.');
    }

    return payload;
  }

  private parseRefreshToken(refreshToken: string): RefreshTokenSubject {
    const payload = this.verifyToken<RefreshTokenPayload>(
      refreshToken,
      this.jwtRefreshTokenSecret,
      'refresh',
    );

    return {
      userId: payload.sub,
      tokenId: payload.jti,
      expiresAt: new Date(payload.exp * 1000),
    };
  }

  private isAccessTokenPayload(
    payload: BaseTokenPayload,
  ): payload is AccessTokenPayload {
    const roles = (payload as Partial<AccessTokenPayload>).roles;

    return (
      Array.isArray(roles) &&
      roles.every((role) => typeof role === 'string' && role.length > 0)
    );
  }

  private encodeJson(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private decodeJson<TValue>(value: string): TValue {
    try {
      return JSON.parse(
        Buffer.from(value, 'base64url').toString('utf8'),
      ) as TValue;
    } catch {
      throw new UnauthorizedException('Token is invalid.');
    }
  }

  private createSignature(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private signaturesMatch(
    signature: string,
    expectedSignature: string,
  ): boolean {
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  }

  private parseDurationToSeconds(value: string, envName: string): number {
    const normalizedValue = value.trim().toLowerCase();
    const matchedValue = normalizedValue.match(/^(\d+)([smhd])$/);

    if (matchedValue === null) {
      throw new InternalServerErrorException(
        `${envName} must use the format <number><s|m|h|d>.`,
      );
    }

    const amount = Number(matchedValue[1]);
    const unit = matchedValue[2];

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new InternalServerErrorException(
        `${envName} must be greater than zero.`,
      );
    }

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        throw new InternalServerErrorException(
          `${envName} contains an unsupported unit.`,
        );
    }
  }

  private get jwtIssuer(): string {
    return this.configService.get('auth.jwtIssuer', { infer: true });
  }

  private get appName(): string {
    return this.configService.get('app.name', { infer: true });
  }

  private get nodeEnv(): ApplicationConfig['app']['nodeEnv'] {
    return this.configService.get('app.nodeEnv', { infer: true });
  }

  private get jwtAccessTokenSecret(): string {
    return this.configService.get('auth.accessTokenSecret', { infer: true });
  }

  private get jwtAccessTokenTtl(): string {
    return this.configService.get('auth.accessTokenTtl', { infer: true });
  }

  private get jwtRefreshTokenSecret(): string {
    return this.configService.get('auth.refreshTokenSecret', { infer: true });
  }

  private get jwtRefreshTokenTtl(): string {
    return this.configService.get('auth.refreshTokenTtl', { infer: true });
  }
}
