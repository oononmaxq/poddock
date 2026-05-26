import { Hono } from 'hono';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { createDb } from '@infrastructure/db/client';
import { listeningHistories } from '@infrastructure/db/schema';
import { nowISO } from '@infrastructure/utils/date';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

const upsertHistorySchema = z.object({
  episode_id: z.string().min(1),
  podcast_id: z.string().min(1),
  title: z.string().min(1),
  podcast_title: z.string().min(1),
  audio_url: z.string().url(),
  cover_image_url: z.string().url().nullable().optional(),
  last_position_seconds: z.number().int().min(0).default(0),
  duration_seconds: z.number().int().min(0).default(0),
  last_played_at: z.string().datetime().optional(),
});

export const listeningHistoryRoutes = new Hono<AppEnv>();

listeningHistoryRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);
  const { limit, offset } = listQuerySchema.parse(c.req.query());

  const rows = await db
    .select({
      episodeId: listeningHistories.episodeId,
      podcastId: listeningHistories.podcastId,
      title: listeningHistories.title,
      podcastTitle: listeningHistories.podcastTitle,
      audioUrl: listeningHistories.audioUrl,
      coverImageUrl: listeningHistories.coverImageUrl,
      lastPositionSeconds: listeningHistories.lastPositionSeconds,
      durationSeconds: listeningHistories.durationSeconds,
      lastPlayedAt: listeningHistories.lastPlayedAt,
    })
    .from(listeningHistories)
    .where(eq(listeningHistories.userId, userId))
    .orderBy(desc(listeningHistories.lastPlayedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ items: rows });
});

listeningHistoryRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);
  const body = await c.req.json();
  const data = upsertHistorySchema.parse(body);
  const now = nowISO();
  const id = `${userId}:${data.episode_id}`;

  await db
    .insert(listeningHistories)
    .values({
      id,
      userId,
      episodeId: data.episode_id,
      podcastId: data.podcast_id,
      title: data.title,
      podcastTitle: data.podcast_title,
      audioUrl: data.audio_url,
      coverImageUrl: data.cover_image_url ?? null,
      lastPositionSeconds: data.last_position_seconds,
      durationSeconds: data.duration_seconds,
      lastPlayedAt: data.last_played_at ?? now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: listeningHistories.id,
      set: {
        podcastId: data.podcast_id,
        title: data.title,
        podcastTitle: data.podcast_title,
        audioUrl: data.audio_url,
        coverImageUrl: data.cover_image_url ?? null,
        lastPositionSeconds: data.last_position_seconds,
        durationSeconds: data.duration_seconds,
        lastPlayedAt: data.last_played_at ?? now,
        updatedAt: now,
      },
    });

  return c.json({ message: 'ok' });
});
