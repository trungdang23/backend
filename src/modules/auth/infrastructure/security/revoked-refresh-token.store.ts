import { InternalServerErrorException } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir, tmpdir } from 'os';
import { dirname, join } from 'path';

import type { NodeEnvironment } from '../../../../app/config/app-config';

interface RevokedRefreshTokenState {
  version: 1;
  tokens: Record<string, number>;
}

export class RevokedRefreshTokenStore {
  private readonly stateFilePath: string;
  private readonly revokedTokenExpirations = new Map<string, number>();
  private loadPromise: Promise<void> | null = null;
  private operationQueue: Promise<void> = Promise.resolve();

  constructor(appName: string, nodeEnv: NodeEnvironment) {
    this.stateFilePath = join(
      this.resolveStateDirectory(appName, nodeEnv),
      'auth',
      'revoked-refresh-tokens.json',
    );
  }

  isRevoked(tokenId: string): Promise<boolean> {
    return this.withLock(async () => {
      await this.ensureLoaded();

      if (this.pruneExpiredTokens(Date.now())) {
        await this.persistState();
      }

      return this.revokedTokenExpirations.has(tokenId);
    });
  }

  consume(tokenId: string, expiresAt: Date): Promise<boolean> {
    return this.withLock(async () => {
      await this.ensureLoaded();

      const now = Date.now();
      const expiresAtMs = expiresAt.getTime();
      const hasExpiredEntries = this.pruneExpiredTokens(now);

      if (expiresAtMs <= now) {
        if (hasExpiredEntries) {
          await this.persistState();
        }

        return false;
      }

      if (this.revokedTokenExpirations.has(tokenId)) {
        if (hasExpiredEntries) {
          await this.persistState();
        }

        return false;
      }

      this.revokedTokenExpirations.set(tokenId, expiresAtMs);
      await this.persistState();

      return true;
    });
  }

  private ensureLoaded(): Promise<void> {
    if (this.loadPromise !== null) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadState().catch((error: unknown) => {
      this.loadPromise = null;
      throw error;
    });

    return this.loadPromise;
  }

  private async loadState(): Promise<void> {
    try {
      const rawState = await readFile(this.stateFilePath, 'utf8');
      const parsedState = this.parseState(rawState);

      this.revokedTokenExpirations.clear();

      for (const [tokenId, expirationMs] of Object.entries(parsedState.tokens)) {
        this.revokedTokenExpirations.set(tokenId, expirationMs);
      }
    } catch (error: unknown) {
      if (this.isFileNotFoundError(error)) {
        return;
      }

      throw new InternalServerErrorException(
        'Refresh token revoke state is unavailable.',
      );
    }
  }

  private parseState(rawState: string): RevokedRefreshTokenState {
    let parsedState: unknown;

    try {
      parsedState = JSON.parse(rawState) as unknown;
    } catch {
      throw new InternalServerErrorException(
        'Refresh token revoke state is unavailable.',
      );
    }

    if (
      !this.isObjectRecord(parsedState) ||
      parsedState.version !== 1 ||
      !this.isObjectRecord(parsedState.tokens)
    ) {
      throw new InternalServerErrorException(
        'Refresh token revoke state is unavailable.',
      );
    }

    const tokens: Record<string, number> = {};

    for (const [tokenId, expirationMs] of Object.entries(parsedState.tokens)) {
      if (
        typeof expirationMs !== 'number' ||
        !Number.isInteger(expirationMs) ||
        !Number.isFinite(expirationMs) ||
        expirationMs <= 0
      ) {
        throw new InternalServerErrorException(
          'Refresh token revoke state is unavailable.',
        );
      }

      tokens[tokenId] = expirationMs;
    }

    return {
      version: 1,
      tokens,
    };
  }

  private pruneExpiredTokens(nowMs: number): boolean {
    let hasChanges = false;

    for (const [tokenId, expirationMs] of this.revokedTokenExpirations) {
      if (expirationMs > nowMs) {
        continue;
      }

      this.revokedTokenExpirations.delete(tokenId);
      hasChanges = true;
    }

    return hasChanges;
  }

  private async persistState(): Promise<void> {
    const serializedState: RevokedRefreshTokenState = {
      version: 1,
      tokens: Object.fromEntries(
        [...this.revokedTokenExpirations.entries()].sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
    };

    await mkdir(dirname(this.stateFilePath), {
      recursive: true,
    });
    await writeFile(
      this.stateFilePath,
      `${JSON.stringify(serializedState, null, 2)}\n`,
      {
        encoding: 'utf8',
        mode: 0o600,
      },
    );
  }

  private resolveStateDirectory(
    appName: string,
    nodeEnv: NodeEnvironment,
  ): string {
    if (nodeEnv === 'test') {
      return join(
        tmpdir(),
        appName,
        `test-refresh-token-state-${process.pid}-${process.env.JEST_WORKER_ID ?? '0'}`,
      );
    }

    const xdgStateHome = process.env.XDG_STATE_HOME?.trim();

    if (xdgStateHome !== undefined && xdgStateHome.length > 0) {
      return join(xdgStateHome, appName);
    }

    return join(homedir(), '.local', 'state', appName);
  }

  private withLock<TValue>(
    operation: () => Promise<TValue>,
  ): Promise<TValue> {
    const result = this.operationQueue.then(operation, operation);

    this.operationQueue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  private isFileNotFoundError(error: unknown): boolean {
    return (
      this.isObjectRecord(error) &&
      typeof error.code === 'string' &&
      error.code === 'ENOENT'
    );
  }

  private isObjectRecord(
    value: unknown,
  ): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
