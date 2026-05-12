import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { ApiResponseInterceptor } from '../../../../src/app/http/api-response.interceptor';

describe('ApiResponseInterceptor', () => {
  const interceptor = new ApiResponseInterceptor();
  const executionContext = {} as ExecutionContext;

  it('wraps plain values in the success envelope', async () => {
    const next = {
      handle: () => of({ status: 'ok' }),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(executionContext, next)),
    ).resolves.toEqual({
      success: true,
      data: {
        status: 'ok',
      },
    });
  });

  it('preserves undefined return values for 204 responses', async () => {
    const next = {
      handle: () => of(undefined),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(executionContext, next)),
    ).resolves.toBeUndefined();
  });

  it('preserves null return values for 204 responses', async () => {
    const next = {
      handle: () => of(null),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(executionContext, next)),
    ).resolves.toBeNull();
  });

  it('preserves values that are already wrapped', async () => {
    const next = {
      handle: () =>
        of({
          success: true,
          data: {
            status: 'ok',
          },
        }),
    } as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(executionContext, next)),
    ).resolves.toEqual({
      success: true,
      data: {
        status: 'ok',
      },
    });
  });
});
