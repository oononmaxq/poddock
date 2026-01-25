import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import { podcasts, feedTokens } from '@infrastructure/db/schema';
import { generateId } from '@infrastructure/utils/id';
import { nowISO } from '@infrastructure/utils/date';

export const feedTokenRoutes = new Hono<AppEnv>();

// Rotate feed token
feedTokenRoutes.post('/rotate', async (c) => {
  const podcastId = c.req.param('podcastId');
  const db = createDb(c.env.DB);

  // Verify podcast exists
  const [podcast] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.id, podcastId))
    .limit(1);

  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  const now = nowISO();
  const newToken = generateId();

  // Update existing token (schema has unique constraint on podcastId)
  await db
    .update(feedTokens)
    .set({
      token: newToken,
      revokedAt: null, // Clear revoked status
      createdAt: now,
    })
    .where(eq(feedTokens.podcastId, podcastId));

  const baseUrl = c.env.BASE_URL;

  return c.json({
    private_rss_url: `${baseUrl}/rss/${podcastId}.xml?token=${newToken}`,
    rotated_at: now,
  });
});
