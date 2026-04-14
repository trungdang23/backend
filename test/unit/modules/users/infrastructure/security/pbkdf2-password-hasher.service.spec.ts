import { Pbkdf2PasswordHasherService } from '../../../../../../src/modules/users/infrastructure/security/pbkdf2-password-hasher.service';

describe('Pbkdf2PasswordHasherService', () => {
  const hasher = new Pbkdf2PasswordHasherService();

  it('hashes and verifies a password', async () => {
    const password = 'StrongPass123!';
    const hash = await hasher.hash(password);

    await expect(hasher.verify(password, hash)).resolves.toBe(true);
    await expect(hasher.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(hasher.verify('password', 'invalid')).resolves.toBe(false);
    await expect(hasher.verify('password', 'pbkdf2$nope')).resolves.toBe(false);
  });
});
