// JWT implementation using Web Crypto API (Cloudflare Workers compatible)

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const signatureBytes = base64UrlDecode(signature);
  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(data));
}

function base64UrlEncode(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function createToken(
  userId: string,
  email: string,
  secret: string,
  expiresIn = 3600
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: userId,
    email,
    iat: now,
    exp: now + expiresIn,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(data, secret);

  return `${data}.${signature}`;
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const isValid = await hmacVerify(data, signature, secret);
  if (!isValid) {
    throw new Error('Invalid signature');
  }

  const payloadBytes = base64UrlDecode(encodedPayload);
  const payloadStr = new TextDecoder().decode(payloadBytes);
  const payload = JSON.parse(payloadStr) as JwtPayload;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
}
