import { Injectable } from '@nestjs/common';
import { pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

import type { PasswordHasherPort } from '../../application/ports/password-hasher.port';

const pbkdf2Async = promisify(pbkdf2);
const DEFAULT_ITERATIONS = 200_000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

@Injectable()
export class Pbkdf2PasswordHasherService implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await pbkdf2Async(
      password,
      salt,
      DEFAULT_ITERATIONS,
      KEY_LENGTH,
      DIGEST,
    );
    const hash = Buffer.from(derivedKey).toString('hex');

    return `pbkdf2$${DEFAULT_ITERATIONS}$${salt}$${hash}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const [scheme, iterationsRaw, salt, hash] = passwordHash.split('$');

    if (!scheme || !iterationsRaw || !salt || !hash) {
      return false;
    }

    if (scheme !== 'pbkdf2') {
      return false;
    }

    const iterations = Number(iterationsRaw);

    if (!Number.isFinite(iterations) || iterations <= 0) {
      return false;
    }

    const derivedKey = await pbkdf2Async(
      password,
      salt,
      iterations,
      KEY_LENGTH,
      DIGEST,
    );
    const derivedHash = Buffer.from(derivedKey).toString('hex');

    return timingSafeEqual(Buffer.from(hash), Buffer.from(derivedHash));
  }
}
