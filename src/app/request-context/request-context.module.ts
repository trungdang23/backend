import { Global, Module } from '@nestjs/common';

import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  exports: [RequestContextMiddleware, RequestContextService],
  providers: [RequestContextMiddleware, RequestContextService],
})
export class RequestContextModule {}
