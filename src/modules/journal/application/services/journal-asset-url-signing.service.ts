import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../../app/config/app-config.service';
import { journalAssetNotFoundException } from '../../../../app/errors/app-exceptions';

export interface ValidateSignedJournalAssetUrlInput {
  publicId: string;
  expiresAt?: string;
  signature?: string;
}

@Injectable()
export class JournalAssetUrlSigningService {
  constructor(private readonly config: AppConfigService) {}

  createSignedPath(publicId: string, nowInSeconds = this.getCurrentTimeInSeconds()): string {
    const expiresAt = nowInSeconds + this.config.journalAssetSignedUrlTtlSeconds;
    const signature = this.createSignature(publicId, expiresAt);

    return `/journal-assets/${encodeURIComponent(publicId)}?expiresAt=${expiresAt}&signature=${signature}`;
  }

  validateSignedPathOrThrow(
    input: ValidateSignedJournalAssetUrlInput,
    nowInSeconds = this.getCurrentTimeInSeconds(),
  ): number {
    if (
      input.expiresAt === undefined ||
      input.signature === undefined ||
      input.signature.trim().length === 0
    ) {
      throw journalAssetNotFoundException();
    }

    const expiresAt = this.parseExpiresAt(input.expiresAt);

    if (expiresAt <= nowInSeconds) {
      throw journalAssetNotFoundException();
    }

    const expectedSignature = this.createSignature(input.publicId, expiresAt);

    if (!this.signaturesMatch(input.signature, expectedSignature)) {
      throw journalAssetNotFoundException();
    }

    return expiresAt;
  }

  getRemainingLifetimeSeconds(
    expiresAt: number,
    nowInSeconds = this.getCurrentTimeInSeconds(),
  ): number {
    return Math.max(0, expiresAt - nowInSeconds);
  }

  private parseExpiresAt(value: string): number {
    const normalizedValue = value.trim();

    if (!/^\d+$/.test(normalizedValue)) {
      throw journalAssetNotFoundException();
    }

    const expiresAt = Number.parseInt(normalizedValue, 10);

    if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) {
      throw journalAssetNotFoundException();
    }

    return expiresAt;
  }

  private createSignature(publicId: string, expiresAt: number): string {
    return createHmac('sha256', this.config.journalAssetSigningSecret)
      .update(`${publicId}.${expiresAt}`)
      .digest('base64url');
  }

  private signaturesMatch(signature: string, expectedSignature: string): boolean {
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedSignatureBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
  }

  private getCurrentTimeInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }
}
