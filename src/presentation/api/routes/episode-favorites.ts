import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { createDb } from '@infrastructure/db/client';
import { episodeFavorites, rssSources } from '@infrastructure/db/schema';
import { nowISO } from '@infrastructure/utils/date';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const statusQuerySchema = z.object({
  source_id: z.string().min(1),
  episode_keys: z.string().min(1),
});

const saveFavoriteSchema = z.object({
  source_id: z.string().min(1),
  episode_key: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  podcast_title: z.string().min(1).max(500),
  cover_image_url: z.string().url().nullable().optional(),
  link: z.string().url().nullable().optional(),
  enclosure_url: z.string().url().nullable().optional(),
  pub_date: z.string().nullable().optional(),
});

const deleteFavoriteSchema = z.object({
  source_id: z.string().min(1),
  episode_key: z.string().min(1).max(500),
});

export const episodeFavoriteRoutes = new Hono<AppEnv>();

episodeFavoriteRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);
  const { limit, offset } = listQuerySchema.parse(c.req.query());

  const items = await db
    .select({
      sourceId: episodeFavorites.sourceId,
      episodeKey: episodeFavorites.episodeKey,
      title: episodeFavorites.title,
      podcastTitle: episodeFavorites.podcastTitle,
      coverImageUrl: episodeFavorites.coverImageUrl,
      link: episodeFavorites.link,
      enclosureUrl: episodeFavorites.enclosureUrl,
      pubDate: episodeFavorites.pubDate,
      createdAt: episodeFavorites.createdAt,
    })
    .from(episodeFavorites)
    .where(eq(episodeFavorites.userId, userId))
    .orderBy(desc(episodeFavorites.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ items });
});

episodeFavoriteRoutes.get('/status', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);
  const { source_id: sourceId, episode_keys: episodeKeysRaw } = statusQuerySchema.parse(c.req.query());
  const episodeKeys = Array.from(
    new Set(
      episodeKeysRaw
        .split(',')
        .map((key) => key.trim())
        .filter((key) => key.length > 0)
    )
  ).slice(0, 200);

  if (episodeKeys.length === 0) {
    return c.json({ keys: [] });
  }

  const rows = await db
    .select({ episodeKey: episodeFavorites.episodeKey })
    .from(episodeFavorites)
    .where(
      and(
        eq(episodeFavorites.userId, userId),
        eq(episodeFavorites.sourceId, sourceId),
        inArray(episodeFavorites.episodeKey, episodeKeys)
      )
    );

  return c.json({ keys: rows.map((row) => row.episodeKey) });
});

episodeFavoriteRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);
  const body = await c.req.json();
  const data = saveFavoriteSchema.parse(body);

  const source = await db
    .select({ id: rssSources.id })
    .from(rssSources)
    .where(and(eq(rssSources.id, data.source_id), eq(rssSources.isActive, true)))
    .get();
  if (!source) {
    return c.json({ error: 'NOT_FOUND', message: 'Source not found' }, 404);
  }

  const now = nowISO();
  const id = `${userId}:${data.source_id}:${data.episode_key}`;

  await db
    .insert(episodeFavorites)
    .values({
      id,
      userId,
      sourceId: data.source_id,
      episodeKey: data.episode_key,
      title: data.title,
      podcastTitle: data.podcast_title,
      coverImageUrl: data.cover_image_url ?? null,
      link: data.link ?? null,
      enclosureUrl: data.enclosure_url ?? null,
      pubDate: data.pub_date ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: episodeFavorites.id,
      set: {
        title: data.title,
        podcastTitle: data.podcast_title,
        coverImageUrl: data.cover_image_url ?? null,
        link: data.link ?? null,
        enclosureUrl: data.enclosure_url ?? null,
        pubDate: data.pub_date ?? null,
        updatedAt: now,
      },
    });

  return c.json({ message: 'ok' });
});

episodeFavoriteRoutes.delete('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);
  const body = await c.req.json();
  const data = deleteFavoriteSchema.parse(body);

  await db
    .delete(episodeFavorites)
    .where(
      and(
        eq(episodeFavorites.userId, userId),
        eq(episodeFavorites.sourceId, data.source_id),
        eq(episodeFavorites.episodeKey, data.episode_key)
      )
    );

  return c.body(null, 204);
});
