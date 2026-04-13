import {
  CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import type { Observable } from 'rxjs';

import {
  buildSuccessResponse,
  isApiErrorResponse,
  isApiSuccessResponse,
} from './api-response';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (isApiSuccessResponse(value) || isApiErrorResponse(value)) {
          return value;
        }

        return buildSuccessResponse(value);
      }),
    );
  }
}
