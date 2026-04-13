export const CORRELATION_ID_HEADER = 'x-correlation-id';

export interface RequestContextState {
  correlationId: string;
  actorId?: string;
  requestMethod?: string;
  requestPath?: string;
}
