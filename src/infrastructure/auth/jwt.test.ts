import { describe, it, expect } from 'vitest';
import { createToken, verifyToken } from './jwt';

describe('JWT', () => {
  const secret = 'test-secret-key';

  it('should create and verify a valid token', async () => {
    const token = await createToken('user-123', 'test@example.com', secret);
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);

    const payload = await verifyToken(token, secret);
    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('test@example.com');
  });

  it('should reject token with invalid signature', async () => {
    const token = await createToken('user-123', 'test@example.com', secret);

    await expect(verifyToken(token, 'wrong-secret')).rejects.toThrow();
  });

  it('should reject expired token', async () => {
    // Create token that expires immediately
    const token = await createToken('user-123', 'test@example.com', secret, -1);

    await expect(verifyToken(token, secret)).rejects.toThrow('Token expired');
  });

  it('should reject malformed token', async () => {
    await expect(verifyToken('invalid', secret)).rejects.toThrow('Invalid token format');
    await expect(verifyToken('a.b', secret)).rejects.toThrow('Invalid token format');
    await expect(verifyToken('a.b.c.d', secret)).rejects.toThrow('Invalid token format');
  });
});
