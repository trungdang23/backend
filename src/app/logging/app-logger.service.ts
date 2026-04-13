import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

import { sanitizeLogData } from './sanitize-log-data';

@Injectable()
export class AppLogger extends ConsoleLogger {
  constructor() {
    super('JourneyBackend');
    this.setLogLevels(['log', 'error', 'warn', 'debug', 'verbose'] satisfies LogLevel[]);
  }

  logWithMetadata(
    message: string,
    metadata: unknown,
    context?: string,
  ): void {
    super.log(this.formatStructuredMessage(message, metadata), context);
  }

  errorWithMetadata(
    message: string,
    stack: string | undefined,
    metadata: unknown,
    context?: string,
  ): void {
    super.error(this.formatStructuredMessage(message, metadata), stack, context);
  }

  private formatStructuredMessage(
    message: string,
    metadata: unknown,
  ): string {
    return `${message} ${this.stringifyMetadata(metadata)}`;
  }

  private stringifyMetadata(metadata: unknown): string {
    try {
      return JSON.stringify(sanitizeLogData(metadata));
    } catch {
      return '[Unserializable metadata]';
    }
  }
}
