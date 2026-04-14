import type { Request } from 'express';

function normalizeHeaderValue(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) {
    return normalizeHeaderValue(value[0]);
  }

  if (value === undefined) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? null : normalized;
}

export function resolveClientIp(request: Request): string {
  const cloudflareConnectingIp = normalizeHeaderValue(
    request.headers['cf-connecting-ip'],
  );

  if (cloudflareConnectingIp !== null) {
    return cloudflareConnectingIp;
  }

  const forwardedFor = normalizeHeaderValue(request.headers['x-forwarded-for']);

  if (forwardedFor !== null) {
    const firstForwardedIp = forwardedFor.split(',')[0]?.trim();

    if (firstForwardedIp !== undefined && firstForwardedIp.length > 0) {
      return firstForwardedIp;
    }
  }

  const realIp = normalizeHeaderValue(request.headers['x-real-ip']);

  if (realIp !== null) {
    return realIp;
  }

  if (typeof request.ip === 'string' && request.ip.trim().length > 0) {
    return request.ip;
  }

  return request.socket.remoteAddress ?? 'unknown';
}
