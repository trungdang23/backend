import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';

import type { RequestContextState } from './request-context';

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextState>();

  run<T>(initialContext: RequestContextState, callback: () => T): T {
    return this.storage.run({ ...initialContext }, callback);
  }

  getContext(): RequestContextState | undefined {
    return this.storage.getStore();
  }

  assign(contextPatch: Partial<RequestContextState>): void {
    const currentContext = this.storage.getStore();

    if (currentContext === undefined) {
      return;
    }

    Object.assign(currentContext, contextPatch);
  }
}
