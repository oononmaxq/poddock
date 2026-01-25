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

  it('should handle legacy bcrypt hashes with admin123', async () => {
    // Seed data uses bcrypt format
    const bcryptHash = '$2a$10$rOvHPHKBCkWFdxNJQ7QJD.Y8wCOKWxZJF.SsJZQlOiPmJZxJZZZZZ';

    expect(await verifyPassword('admin123', bcryptHash)).toBe(true);
    expect(await verifyPassword('wrong', bcryptHash)).toBe(false);
  });
});
