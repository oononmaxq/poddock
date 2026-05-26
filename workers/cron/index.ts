/**
 * Cron Worker for scheduled episode publishing
 *
 * Deploy with: wrangler deploy --config wrangler-cron.toml
 */

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, lte } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { fetchAndParseRss } from '../../src/infrastructure/rss/feed-parser';

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

const SNAPSHOT_REFRESH_LIMIT = 50;

function toIsoDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  } catch {
    return null;
  }
}

async function refreshRssSnapshots(env: Env, limit: number) {
  const now = new Date().toISOString();

  const rows = await env.DB
    .prepare(
      `SELECT id, name, feed_url
       FROM rss_sources
       WHERE is_active = 1
       ORDER BY updated_at ASC
       LIMIT ?`
    )
    .bind(limit)
    .all<{ id: string; name: string | null; feed_url: string }>();

  const sources = rows.results ?? [];
  if (sources.length === 0) {
    console.log('No rss sources to refresh');
    return;
  }

  for (const source of sources) {
    try {
      const feed = await fetchAndParseRss(source.feed_url);
      // Use lastBuildDate from feed, fallback to latest episode pubDate
      const latestPubDateRaw = feed.lastBuildDate ?? feed.items.reduce<string | null>((latest, item) => {
        if (!item.pubDate) return latest;
        if (!latest) return item.pubDate;
        return Date.parse(item.pubDate) > Date.parse(latest) ? item.pubDate : latest;
      }, null);
      const latestPublishedAt = toIsoDate(latestPubDateRaw);

      await env.DB
        .prepare(
          `INSERT INTO rss_source_snapshots (
            source_id, feed_title, feed_description, feed_image_url, feed_author, feed_language,
            categories_json, episode_count, latest_published_at, last_fetched_at, fetch_error, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
          ON CONFLICT(source_id) DO UPDATE SET
            feed_title = excluded.feed_title,
            feed_description = excluded.feed_description,
            feed_image_url = excluded.feed_image_url,
            feed_author = excluded.feed_author,
            feed_language = excluded.feed_language,
            categories_json = excluded.categories_json,
            episode_count = excluded.episode_count,
            latest_published_at = excluded.latest_published_at,
            last_fetched_at = excluded.last_fetched_at,
            fetch_error = NULL,
            updated_at = excluded.updated_at`
        )
        .bind(
          source.id,
          feed.title || source.name || source.id,
          feed.description,
          feed.imageUrl,
          feed.author,
          feed.language,
          JSON.stringify(feed.categories),
          feed.items.length,
          latestPublishedAt,
          now,
          now
        )
        .run();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown RSS fetch error';
      await env.DB
        .prepare(
          `INSERT INTO rss_source_snapshots (
            source_id, feed_title, feed_description, feed_image_url, feed_author, feed_language,
            categories_json, episode_count, latest_published_at, last_fetched_at, fetch_error, updated_at
          ) VALUES (?, ?, '', NULL, '', '', '[]', 0, NULL, ?, ?, ?)
          ON CONFLICT(source_id) DO UPDATE SET
            last_fetched_at = excluded.last_fetched_at,
            fetch_error = excluded.fetch_error,
            updated_at = excluded.updated_at`
        )
        .bind(source.id, source.name || source.id, now, message, now)
        .run();
      console.log(`Failed to refresh RSS snapshot: ${source.id} (${message})`);
    }

    await env.DB
      .prepare('UPDATE rss_sources SET updated_at = ? WHERE id = ?')
      .bind(now, source.id)
      .run();
  }

  console.log(`Refreshed rss snapshots: ${sources.length}`);
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
    } else {
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
    }

    await refreshRssSnapshots(env, SNAPSHOT_REFRESH_LIMIT);
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
