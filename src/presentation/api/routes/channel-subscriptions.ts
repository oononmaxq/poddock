import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { createDb } from '@infrastructure/db/client';
import { rssSources, userChannelSubscriptions } from '@infrastructure/db/schema';
import { generateId } from '@infrastructure/utils/id';
import { nowISO } from '@infrastructure/utils/date';
import { fetchAndParseRss } from '@infrastructure/rss/feed-parser';
import { AppError } from '../middleware/error-handler';

const subscribeSchema = z.object({
  source_id: z.string().min(1),
});

const latestQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const channelSubscriptionRoutes = new Hono<AppEnv>();

channelSubscriptionRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);

  const rows = await db
    .select({
      sourceId: rssSources.id,
      sourceName: rssSources.name,
      feedUrl: rssSources.feedUrl,
      subscribedAt: userChannelSubscriptions.createdAt,
    })
    .from(userChannelSubscriptions)
    .innerJoin(rssSources, eq(userChannelSubscriptions.sourceId, rssSources.id))
    .where(and(eq(userChannelSubscriptions.userId, userId), eq(rssSources.isActive, true)))
    .orderBy(desc(userChannelSubscriptions.createdAt));

  const items = await Promise.all(
    rows.map(async (row) => {
      try {
        const feed = await fetchAndParseRss(row.feedUrl);
        return {
          sourceId: row.sourceId,
          sourceName: row.sourceName,
          feedTitle: feed.title || row.sourceName || row.sourceId,
          feedImageUrl: feed.imageUrl,
          category: feed.categories[0] || null,
          feedUrl: row.feedUrl,
          subscribedAt: row.subscribedAt,
        };
      } catch {
        return {
          sourceId: row.sourceId,
          sourceName: row.sourceName,
          feedTitle: row.sourceName || row.sourceId,
          feedImageUrl: null,
          category: null,
          feedUrl: row.feedUrl,
          subscribedAt: row.subscribedAt,
        };
      }
    })
  );

  return c.json({ items });
});

channelSubscriptionRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);
  const body = await c.req.json();
  const { source_id: sourceId } = subscribeSchema.parse(body);

  const source = await db
    .select({ id: rssSources.id })
    .from(rssSources)
    .where(and(eq(rssSources.id, sourceId), eq(rssSources.isActive, true)))
    .get();
  if (!source) {
    throw new AppError(404, 'not_found', 'RSS source not found');
  }

  const now = nowISO();
  await db
    .insert(userChannelSubscriptions)
    .values({
      id: `${userId}:${sourceId}`,
      userId,
      sourceId,
      createdAt: now,
    })
    .onConflictDoNothing();

  return c.json({ message: 'ok' });
});

channelSubscriptionRoutes.delete('/:sourceId', async (c) => {
  const userId = c.get('userId');
  const sourceId = c.req.param('sourceId');
  const db = createDb(c.env.DB);

  await db
    .delete(userChannelSubscriptions)
    .where(and(eq(userChannelSubscriptions.userId, userId), eq(userChannelSubscriptions.sourceId, sourceId)));

  return c.body(null, 204);
});

channelSubscriptionRoutes.get('/latest', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);
  const { limit } = latestQuerySchema.parse(c.req.query());

  const subscriptions = await db
    .select({
      sourceId: rssSources.id,
      sourceName: rssSources.name,
      feedUrl: rssSources.feedUrl,
    })
    .from(userChannelSubscriptions)
    .innerJoin(rssSources, eq(userChannelSubscriptions.sourceId, rssSources.id))
    .where(and(eq(userChannelSubscriptions.userId, userId), eq(rssSources.isActive, true)));

  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        const feed = await fetchAndParseRss(subscription.feedUrl);
        return feed.items.slice(0, 8).map((item, index) => ({
          id: `${subscription.sourceId}:${index}:${item.pubDate ?? 'no-date'}`,
          sourceId: subscription.sourceId,
          sourceName: subscription.sourceName || feed.title || subscription.sourceId,
          feedTitle: feed.title || subscription.sourceName || subscription.sourceId,
          feedImageUrl: feed.imageUrl,
          title: item.title,
          description: item.description,
          pubDate: item.pubDate,
          link: item.link,
          enclosureUrl: item.enclosureUrl,
          timestamp: item.pubDate ? Date.parse(item.pubDate) : 0,
        }));
      } catch {
        return [];
      }
    })
  );

  const items = results
    .flat()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .map(({ timestamp: _timestamp, ...rest }) => rest);

  return c.json({ items });
});
