import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { eq, and, gt } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { magicLinkRateLimiter, authRateLimiter } from '../middleware/rate-limit';
import { createDb } from '@infrastructure/db/client';
import { adminUsers, magicLinks } from '@infrastructure/db/schema';
import { createToken, verifyToken } from '@infrastructure/auth/jwt';
import { generateId } from '@infrastructure/utils/id';
import { nowISO } from '@infrastructure/utils/date';
import { sendEmail, createMagicLinkEmail } from '@infrastructure/email/resend';

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const MAGIC_LINK_GRACE_PERIOD_SECONDS = 30; // PWA redirect grace period

const requestMagicLinkSchema = z.object({
  email: z.string().email(),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1),
});

export const authRoutes = new Hono<AppEnv>();

function prefersJson(acceptHeader: string): boolean {
  return acceptHeader.includes('application/json');
}

function shouldUseSecureCookie(baseUrl: string): boolean {
  return !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1');
}

function buildAccessTokenCookie(token: string, baseUrl: string): string {
  const parts = [
    `access_token=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=86400',
  ];
  if (shouldUseSecureCookie(baseUrl)) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function buildClearAccessTokenCookie(baseUrl: string): string {
  const parts = [
    'access_token=',
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
  ];
  if (shouldUseSecureCookie(baseUrl)) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

authRoutes.get('/status', async (c) => {
  c.header('Cache-Control', 'no-store');
  const token = getCookie(c, 'access_token');
  if (!token) {
    return c.json({ authenticated: false });
  }

  try {
    await verifyToken(token, c.env.JWT_SECRET);
    return c.json({ authenticated: true });
  } catch {
    return c.json({ authenticated: false });
  }
});

// Request magic link - sends email with login link
// Rate limited to 3 requests per 15 minutes
authRoutes.post('/magic-link', magicLinkRateLimiter, async (c) => {
  const body = await c.req.json();
  const { email } = requestMagicLinkSchema.parse(body);

  const db = createDb(c.env.DB);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  // Generate secure token
  const token = generateId() + generateId(); // Longer token for security

  // Store magic link
  try {
    await db.insert(magicLinks).values({
      id: generateId(),
      email: email.toLowerCase(),
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: nowISO(),
    });
  } catch (err) {
    console.error('Failed to insert magic link:', err);
    throw new AppError(500, 'db_error', 'Failed to create magic link. Run migrations?');
  }

  // Build magic link URL
  const baseUrl = c.env.BASE_URL;
  const magicLinkUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  // Development: log magic link to console
  if (baseUrl.includes('localhost')) {
    console.log('\n========================================');
    console.log('🔗 MAGIC LINK (dev only):');
    console.log(magicLinkUrl);
    console.log('========================================\n');
  }

  // Send email (skip if no API key configured)
  if (c.env.RESEND_API_KEY && !c.env.RESEND_API_KEY.startsWith('re_xxx')) {
    const emailContent = createMagicLinkEmail(magicLinkUrl, 'ja');
    const result = await sendEmail(
      {
        apiKey: c.env.RESEND_API_KEY,
        from: c.env.RESEND_FROM,
      },
      {
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      }
    );

    if (!result.success) {
      console.error('Failed to send magic link email:', result.error);
      // Don't reveal email sending failure to prevent enumeration
    }
  }

  // Always return success to prevent email enumeration
  return c.json({
    message: 'If the email exists, a login link has been sent',
    expires_in: MAGIC_LINK_EXPIRY_MINUTES * 60,
  });
});

// Verify magic link token and issue JWT
// Rate limited to 5 requests per 15 minutes
authRoutes.get('/verify', authRateLimiter, async (c) => {
  const token = c.req.query('token');
  const acceptHeader = c.req.header('Accept') || '';
  const wantsJson = prefersJson(acceptHeader);

  if (!token) {
    if (wantsJson) {
      throw new AppError(400, 'missing_token', 'Token is required');
    }
    return c.redirect('/login?error=missing_token');
  }

  const db = createDb(c.env.DB);
  const now = nowISO();

  // Find valid, unused magic link
  let magicLink;
  try {
    magicLink = await db.query.magicLinks.findFirst({
      where: and(
        eq(magicLinks.token, token),
        gt(magicLinks.expiresAt, now)
      ),
    });
  } catch (err) {
    console.error('Failed to query magic_links:', err);
    throw new AppError(500, 'db_error', 'Database error. Run migrations?');
  }

  if (!magicLink) {
    if (wantsJson) {
      throw new AppError(400, 'invalid_token', 'Invalid or expired token');
    }
    return c.redirect('/login?error=invalid_token');
  }

  // Check if token was already used
  let isWithinGracePeriod = false;
  if (magicLink.usedAt) {
    // Allow reuse within grace period for PWA redirect scenarios
    const usedAtTime = new Date(magicLink.usedAt).getTime();
    const gracePeriodMs = MAGIC_LINK_GRACE_PERIOD_SECONDS * 1000;
    isWithinGracePeriod = Date.now() - usedAtTime < gracePeriodMs;

    if (!isWithinGracePeriod) {
      if (wantsJson) {
        throw new AppError(400, 'token_used', 'This link has already been used');
      }
      return c.redirect('/login?error=token_used');
    }
    // Within grace period: skip marking as used, proceed to issue JWT
  }

  // Mark token as used (only if not already used)
  if (!isWithinGracePeriod) {
    try {
      const result = await db.update(magicLinks)
        .set({ usedAt: now })
        .where(and(
          eq(magicLinks.id, magicLink.id),
          eq(magicLinks.usedAt, null as unknown as string) // Only update if not already used
        ));

      // Check if update actually modified a row
      // If another request already used this token, check grace period
      if (!result.rowsAffected || result.rowsAffected === 0) {
        // Re-fetch to check if within grace period
        const refreshedLink = await db.query.magicLinks.findFirst({
          where: eq(magicLinks.id, magicLink.id),
        });

        if (refreshedLink?.usedAt) {
          const usedAtTime = new Date(refreshedLink.usedAt).getTime();
          const gracePeriodMs = MAGIC_LINK_GRACE_PERIOD_SECONDS * 1000;
          if (Date.now() - usedAtTime < gracePeriodMs) {
            // Within grace period, continue
            isWithinGracePeriod = true;
          } else {
            if (wantsJson) {
              throw new AppError(400, 'token_used', 'This link has already been used');
            }
            return c.redirect('/login?error=token_used');
          }
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('Failed to update magic_links:', err);
      throw new AppError(500, 'db_error', 'Failed to verify token');
    }
  }

  // Find or create user
  let user;
  try {
    user = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, magicLink.email),
    });
  } catch (err) {
    console.error('Failed to query adminUsers:', err);
  }

  if (!user) {
    // Create new user (first-time login = signup)
    const userId = generateId();
    try {
      await db.insert(adminUsers).values({
        id: userId,
        email: magicLink.email,
        passwordHash: '', // Empty for magic link users
        plan: 'free',
        createdAt: now,
      });

      user = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.id, userId),
      });
    } catch (err) {
      console.error('Failed to create user:', err);
      throw new AppError(500, 'user_creation_failed', 'Failed to create user');
    }
  }

  if (!user) {
    throw new AppError(500, 'user_creation_failed', 'Failed to create user');
  }

  // Issue JWT
  const accessToken = await createToken(user.id, user.email, c.env.JWT_SECRET);

  // Set HttpOnly cookie
  c.header('Set-Cookie', buildAccessTokenCookie(accessToken, c.env.BASE_URL));
  c.header('Cache-Control', 'no-store');

  // Redirect to dashboard with token (or return JSON for API use)
  if (wantsJson) {
    return c.json({
      message: 'Login successful',
      expires_in: 86400,
    });
  }

  // Redirect directly to dashboard
  return c.redirect('/podcasts');
});

// Legacy login endpoint (for backward compatibility during migration)
authRoutes.post('/login', async (c) => {
  throw new AppError(410, 'deprecated', 'Password login is deprecated. Please use magic link.');
});

authRoutes.post('/logout', async (c) => {
  // Clear the HttpOnly cookie by setting it to expire immediately
  c.header('Set-Cookie', buildClearAccessTokenCookie(c.env.BASE_URL));
  c.header('Cache-Control', 'no-store');
  return c.json({ message: 'Logged out' });
});

authRoutes.get('/logout', async (c) => {
  return c.json(
    { error: 'METHOD_NOT_ALLOWED', message: 'Use POST /api/auth/logout' },
    405
  );
});
