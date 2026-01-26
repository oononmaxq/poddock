import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import { episodes, podcasts, assets, playLogs, monthlyPlayStats } from '@infrastructure/db/schema';
import { generateId } from '@infrastructure/utils/id';
import { nowISO } from '@infrastructure/utils/date';

export const playRoutes = new Hono<AppEnv>();

// Hash IP address for privacy
function hashIp(ip: string): string {
  // Simple hash for privacy - not cryptographically secure but sufficient for analytics
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Get current year-month in YYYY-MM format
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Play redirect endpoint
// GET /play/:episodeId - Logs play and redirects to actual audio URL
playRoutes.get('/:episodeId', async (c) => {
  const episodeId = c.req.param('episodeId');
  const db = createDb(c.env.DB);

  // Find episode with its podcast and audio asset
  const episode = await db.query.episodes.findFirst({
    where: eq(episodes.id, episodeId),
  });

  if (!episode) {
    throw new AppError(404, 'not_found', 'Episode not found');
  }

  if (episode.status !== 'published') {
    throw new AppError(404, 'not_found', 'Episode not found');
  }

  if (!episode.audioAssetId) {
    throw new AppError(404, 'not_found', 'Audio not available');
  }

  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, episode.audioAssetId),
  });

  if (!asset) {
    throw new AppError(404, 'not_found', 'Audio not available');
  }

  // Log the play asynchronously (don't block the redirect)
  const now = nowISO();
  const yearMonth = getCurrentYearMonth();
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0] || '';
  const userAgent = c.req.header('User-Agent') || '';
  const country = c.req.header('CF-IPCountry') || '';

  // Insert play log
  await db.insert(playLogs).values({
    id: generateId(),
    episodeId,
    podcastId: episode.podcastId,
    ipHash: clientIp ? hashIp(clientIp) : null,
    userAgent: userAgent.substring(0, 500), // Limit length
    country: country || null,
    playedAt: now,
  });

  // Update monthly stats (upsert pattern)
  const existingStats = await db
    .select()
    .from(monthlyPlayStats)
    .where(
      and(
        eq(monthlyPlayStats.podcastId, episode.podcastId),
        eq(monthlyPlayStats.yearMonth, yearMonth)
      )
    )
    .limit(1);

  if (existingStats.length > 0) {
    await db
      .update(monthlyPlayStats)
      .set({
        playCount: sql`${monthlyPlayStats.playCount} + 1`,
        updatedAt: now,
      })
      .where(eq(monthlyPlayStats.id, existingStats[0].id));
  } else {
    await db.insert(monthlyPlayStats).values({
      id: generateId(),
      podcastId: episode.podcastId,
      yearMonth,
      playCount: 1,
      updatedAt: now,
    });
  }

  // Redirect to actual audio URL
  return c.redirect(asset.publicUrl, 302);
});
