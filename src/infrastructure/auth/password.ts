// Password hashing using Web Crypto API (Cloudflare Workers compatible)
// Using PBKDF2 as bcrypt is not available in Workers

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

const encoder = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = await deriveKey(password, salt);

  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2:${ITERATIONS}:${saltHex}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
  options?: { allowLegacyDev?: boolean }
): Promise<boolean> {
  const parts = stored.split(':');

  // Legacy bcrypt hashes are not supported
  // In development, can be explicitly allowed for seed data testing only
  if (stored.startsWith('$2')) {
    if (options?.allowLegacyDev) {
      console.warn('[SECURITY] Legacy bcrypt verification used - development only');
      return password === 'admin123';
    }
    // Production: Always reject legacy hashes - force password reset
    console.error('[SECURITY] Rejected legacy bcrypt hash - migration required');
    return false;
  }

  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  const saltHex = parts[2];
  const storedHashHex = parts[3];

  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const hash = await deriveKey(password, salt, iterations);
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex === storedHashHex;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations = ITERATIONS
): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
}
