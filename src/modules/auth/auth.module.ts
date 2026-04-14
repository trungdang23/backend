import {
  MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';

import { RequestContextModule } from '../../app/request-context/request-context.module';
import { UsersModule } from '../users/users.module';
import { AUTH_TOKEN_SERVICE } from './application/ports/auth-token-service.port';
import { ACCESS_TOKEN_VERIFIER } from './application/ports/access-token-verifier.port';
import { LoginUserService } from './application/services/login-user.service';
import { RefreshAuthSessionService } from './application/services/refresh-auth-session.service';
import { RegisterAuthSessionService } from './application/services/register-auth-session.service';
import { JwtAuthTokenService } from './infrastructure/security/jwt-auth-token.service';
import { AuthController } from './presentation/auth.controller';
import { AccessTokenAuthGuard } from './presentation/guards/access-token-auth.guard';
import { PublicAuthRateLimitMiddleware } from './presentation/public-auth-rate-limit.middleware';
import { PublicAuthRateLimitService } from './presentation/public-auth-rate-limit.service';

@Module({
  imports: [RequestContextModule, UsersModule],
  controllers: [AuthController],
  providers: [
    AccessTokenAuthGuard,
    JwtAuthTokenService,
    LoginUserService,
    PublicAuthRateLimitMiddleware,
    PublicAuthRateLimitService,
    RefreshAuthSessionService,
    RegisterAuthSessionService,
    {
      provide: AUTH_TOKEN_SERVICE,
      useExisting: JwtAuthTokenService,
    },
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: JwtAuthTokenService,
    },
  ],
  exports: [AccessTokenAuthGuard, ACCESS_TOKEN_VERIFIER, AUTH_TOKEN_SERVICE],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(PublicAuthRateLimitMiddleware)
      .forRoutes(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
      );
  }
}
