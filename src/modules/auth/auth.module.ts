import { Module } from '@nestjs/common';

import { RequestContextModule } from '../../app/request-context/request-context.module';
import { ACCESS_TOKEN_VERIFIER } from './application/ports/access-token-verifier.port';
import { UnconfiguredAccessTokenVerifier } from './application/services/unconfigured-access-token-verifier.service';
import { AccessTokenAuthGuard } from './presentation/guards/access-token-auth.guard';

@Module({
  imports: [RequestContextModule],
  providers: [
    AccessTokenAuthGuard,
    UnconfiguredAccessTokenVerifier,
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: UnconfiguredAccessTokenVerifier,
    },
  ],
  exports: [AccessTokenAuthGuard, ACCESS_TOKEN_VERIFIER],
})
export class AuthModule {}
