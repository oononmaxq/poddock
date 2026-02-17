/**
 * Cron Worker for scheduled episode publishing
 *
 * Deploy with: wrangler deploy --config wrangler-cron.toml
 */

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, lte } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Inline schema definition (to avoid import issues in separate worker)
const episodes = sqliteTable('episodes', {
  id: text('id').primaryKey(),
  podcastId: text('podcast_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['draft', 'scheduled', 'published'] }).notNull().default('draft'),
  publishedAt: text('published_at'),
  audioAssetId: text('audio_asset_id'),
  durationSeconds: integer('duration_seconds'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

interface Env {
  DB: D1Database;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const db = drizzle(env.DB);
    const now = new Date().toISOString();

    // Find all scheduled episodes that should be published
    const scheduledEpisodes = await db
      .select({ id: episodes.id, title: episodes.title })
      .from(episodes)
      .where(
        and(
          eq(episodes.status, 'scheduled'),
          lte(episodes.publishedAt, now)
        )
      );

    if (scheduledEpisodes.length === 0) {
      console.log('No episodes to publish');
      return;
    }

    // Publish each episode
    for (const episode of scheduledEpisodes) {
      await db
        .update(episodes)
        .set({
          status: 'published',
          updatedAt: now,
        })
        .where(eq(episodes.id, episode.id));

      console.log(`Published episode: ${episode.title} (${episode.id})`);
    }

    console.log(`Published ${scheduledEpisodes.length} episode(s)`);
  },

  // Also support manual trigger via HTTP for testing
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/trigger' && request.method === 'POST') {
      // Manually trigger the scheduled function
      await this.scheduled({} as ScheduledEvent, env, ctx);
      return new Response('OK', { status: 200 });
    }

    return new Response('Poddock Cron Worker', { status: 200 });
  },
};
