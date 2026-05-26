import type { Context, Next } from 'hono';
import type { AppEnv } from '../types';
import { AppError } from './error-handler';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key prefix for namespacing different limiters */
  keyPrefix?: string;
  /** Optional key generator for custom bucketing (defaults to client IP) */
  keyGenerator?: (c: Context<AppEnv>) => string;
}

// In-memory store for rate limiting
// Note: This is per-worker instance, so not globally distributed
// For production at scale, use Cloudflare Rate Limiting or D1/KV
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

function getClientIdentifier(c: Context<AppEnv>): string {
  // Use CF-Connecting-IP (most reliable on Cloudflare)
  // Fall back to X-Forwarded-For or empty string
  const ip = c.req.header('CF-Connecting-IP')
    || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'unknown';
  return ip;
}

export function createRateLimiter(config: RateLimitConfig) {
  const { limit, windowSeconds, keyPrefix = 'rl', keyGenerator } = config;

  return async (c: Context<AppEnv>, next: Next) => {
    cleanupStaleEntries();

    const bucketKey = keyGenerator ? keyGenerator(c) : getClientIdentifier(c);
    const key = `${keyPrefix}:${bucketKey}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new window
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment count in current window
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, limit - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetSeconds.toString());

    if (entry.count > limit) {
      c.header('Retry-After', resetSeconds.toString());
      throw new AppError(
        429,
        'rate_limit_exceeded',
        `Too many requests. Please try again in ${resetSeconds} seconds.`
      );
    }

    await next();
  };
}

// Pre-configured rate limiters for common use cases
export const authRateLimiter = createRateLimiter({
  limit: 5,
  windowSeconds: 900, // 15 minutes
  keyPrefix: 'auth',
});

export const verifyRateLimiter = createRateLimiter({
  limit: 20,
  windowSeconds: 900, // 15 minutes
  keyPrefix: 'verify',
  keyGenerator: (c) => {
    const ip = getClientIdentifier(c);
    const token = c.req.query('token') || 'no-token';
    return `${ip}:${token.slice(0, 32)}`;
  },
});

export const magicLinkRateLimiter = createRateLimiter({
  limit: 3,
  windowSeconds: 900, // 15 minutes - 3 magic link requests per 15 min
  keyPrefix: 'magic',
});

export const apiRateLimiter = createRateLimiter({
  limit: 100,
  windowSeconds: 60, // 100 requests per minute
  keyPrefix: 'api',
});
