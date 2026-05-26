import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password hashing', () => {
  it('should hash and verify a password', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);

    expect(hash).toContain('pbkdf2:');
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await hashPassword('correct-password');

    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'same-password';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it('should reject legacy bcrypt hashes by default (security)', async () => {
    // Legacy bcrypt hashes should be rejected by default to prevent security issues
    const bcryptHash = '$2a$10$rOvHPHKBCkWFdxNJQ7QJD.Y8wCOKWxZJF.SsJZQlOiPmJZxJZZZZZ';

    // Default behavior: reject legacy hashes
    expect(await verifyPassword('admin123', bcryptHash)).toBe(false);
    expect(await verifyPassword('wrong', bcryptHash)).toBe(false);
  });

  it('should allow legacy bcrypt in dev mode when explicitly enabled', async () => {
    const bcryptHash = '$2a$10$rOvHPHKBCkWFdxNJQ7QJD.Y8wCOKWxZJF.SsJZQlOiPmJZxJZZZZZ';

    // With allowLegacyDev option: accept admin123 for development
    expect(await verifyPassword('admin123', bcryptHash, { allowLegacyDev: true })).toBe(true);
    expect(await verifyPassword('wrong', bcryptHash, { allowLegacyDev: true })).toBe(false);
  });
});
