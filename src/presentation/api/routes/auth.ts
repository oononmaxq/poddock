import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, gt } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import { adminUsers, magicLinks } from '@infrastructure/db/schema';
import { createToken } from '@infrastructure/auth/jwt';
import { generateId } from '@infrastructure/utils/id';
import { nowISO } from '@infrastructure/utils/date';
import { sendEmail, createMagicLinkEmail } from '@infrastructure/email/resend';

const MAGIC_LINK_EXPIRY_MINUTES = 15;

const requestMagicLinkSchema = z.object({
  email: z.string().email(),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1),
});

export const authRoutes = new Hono<AppEnv>();

// Request magic link - sends email with login link
authRoutes.post('/magic-link', async (c) => {
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
authRoutes.get('/verify', async (c) => {
  const token = c.req.query('token');

  if (!token) {
    throw new AppError(400, 'missing_token', 'Token is required');
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
    throw new AppError(400, 'invalid_token', 'Invalid or expired token');
  }

  if (magicLink.usedAt) {
    throw new AppError(400, 'token_used', 'This link has already been used');
  }

  // Mark token as used
  try {
    await db.update(magicLinks)
      .set({ usedAt: now })
      .where(eq(magicLinks.id, magicLink.id));
  } catch (err) {
    console.error('Failed to update magic_links:', err);
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

  // Redirect to dashboard with token (or return JSON for API use)
  const acceptHeader = c.req.header('Accept') || '';
  if (acceptHeader.includes('application/json')) {
    return c.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  }

  // Redirect to a page that stores the token and redirects to dashboard
  const baseUrl = c.env.BASE_URL;
  return c.redirect(`${baseUrl}/auth/callback?token=${accessToken}`);
});

// Legacy login endpoint (for backward compatibility during migration)
authRoutes.post('/login', async (c) => {
  throw new AppError(410, 'deprecated', 'Password login is deprecated. Please use magic link.');
});

authRoutes.post('/logout', async (c) => {
  // JWT is stateless, client should discard the token
  // Redirect to login page for form submissions
  return c.redirect('/login');
});
