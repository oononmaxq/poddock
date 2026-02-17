import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import { podcasts, episodes, assets } from '@infrastructure/db/schema';
import { generateId } from '@infrastructure/utils/id';
import { nowISO } from '@infrastructure/utils/date';
import { checkEpisodeLimit, checkEpisodeDuration } from '@domain/plan/limits';

const createEpisodeSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
  published_at: z.string().datetime().optional().nullable(),
});

const updateEpisodeSchema = createEpisodeSchema.partial();

const attachAudioSchema = z.object({
  audio_asset_id: z.string().min(1),
  duration_seconds: z.number().int().positive().optional(),
});

export const episodeRoutes = new Hono<AppEnv>();

// List episodes
episodeRoutes.get('/', async (c) => {
  const podcastId = c.req.param('podcastId');
  const db = createDb(c.env.DB);
  const status = c.req.query('status');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);

  // Verify podcast exists
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  let results;
  if (status === 'draft' || status === 'scheduled' || status === 'published') {
    results = await db
      .select()
      .from(episodes)
      .where(and(eq(episodes.podcastId, podcastId), eq(episodes.status, status)))
      .orderBy(desc(episodes.publishedAt), desc(episodes.createdAt))
      .limit(limit);
  } else {
    results = await db
      .select()
      .from(episodes)
      .where(eq(episodes.podcastId, podcastId))
      .orderBy(desc(episodes.publishedAt), desc(episodes.createdAt))
      .limit(limit);
  }

  const items = await Promise.all(
    results.map(async (episode) => {
      let audio = null;
      if (episode.audioAssetId) {
        const asset = await db.query.assets.findFirst({
          where: eq(assets.id, episode.audioAssetId),
        });
        if (asset) {
          audio = {
            asset_id: asset.id,
            public_url: asset.publicUrl,
            content_type: asset.contentType,
            byte_size: asset.byteSize,
          };
        }
      }

      return {
        id: episode.id,
        podcast_id: episode.podcastId,
        title: episode.title,
        status: episode.status,
        published_at: episode.publishedAt,
        audio_asset_id: episode.audioAssetId,
        audio,
        duration_seconds: episode.durationSeconds,
        updated_at: episode.updatedAt,
      };
    })
  );

  return c.json({ items, next_cursor: null });
});

// Create episode
episodeRoutes.post('/', async (c) => {
  const podcastId = c.req.param('podcastId');
  const body = await c.req.json();
  const data = createEpisodeSchema.parse(body);

  const db = createDb(c.env.DB);
  const userPlan = c.get('userPlan');

  // Verify podcast exists
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  // Check episode limit
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(episodes)
    .where(eq(episodes.podcastId, podcastId));
  const currentCount = Number(countResult?.count ?? 0);

  const limitCheck = checkEpisodeLimit(currentCount, userPlan);
  if (!limitCheck.allowed) {
    throw new AppError(403, 'plan_limit_exceeded', limitCheck.reason ?? 'Episode limit reached', [
      { field: 'episodes', reason: 'limit_exceeded', current: limitCheck.current, limit: limitCheck.limit },
    ]);
  }

  // Validate publish/schedule conditions
  if (data.status === 'published' || data.status === 'scheduled') {
    if (!data.published_at) {
      throw new AppError(422, 'publish_conditions_not_met', 'published_at is required for published/scheduled status', [
        { field: 'published_at', reason: 'required' },
      ]);
    }
    // audio_asset_id will be required when trying to publish/schedule
    // but on creation it's not set yet, so we allow creating as draft first
    throw new AppError(422, 'publish_conditions_not_met', 'Cannot create episode as published/scheduled without audio', [
      { field: 'audio_asset_id', reason: 'required' },
    ]);
  }

  const now = nowISO();
  const episodeId = generateId();

  await db.insert(episodes).values({
    id: episodeId,
    podcastId,
    title: data.title,
    description: data.description ?? null,
    status: data.status,
    publishedAt: data.published_at ?? null,
    audioAssetId: null,
    durationSeconds: null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json(
    {
      id: episodeId,
      podcast_id: podcastId,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      published_at: data.published_at ?? null,
      audio_asset_id: null,
      created_at: now,
      updated_at: now,
    },
    201
  );
});

// Get episode
episodeRoutes.get('/:episodeId', async (c) => {
  const podcastId = c.req.param('podcastId');
  const episodeId = c.req.param('episodeId');
  const db = createDb(c.env.DB);

  const episode = await db.query.episodes.findFirst({
    where: and(eq(episodes.id, episodeId), eq(episodes.podcastId, podcastId)),
  });

  if (!episode) {
    throw new AppError(404, 'not_found', 'Episode not found');
  }

  let audio = null;
  if (episode.audioAssetId) {
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, episode.audioAssetId),
    });
    if (asset) {
      audio = {
        asset_id: asset.id,
        public_url: asset.publicUrl,
        content_type: asset.contentType,
        byte_size: asset.byteSize,
      };
    }
  }

  return c.json({
    id: episode.id,
    podcast_id: episode.podcastId,
    title: episode.title,
    description: episode.description,
    status: episode.status,
    published_at: episode.publishedAt,
    audio_asset_id: episode.audioAssetId,
    audio,
    duration_seconds: episode.durationSeconds,
    created_at: episode.createdAt,
    updated_at: episode.updatedAt,
  });
});

// Update episode
episodeRoutes.patch('/:episodeId', async (c) => {
  const podcastId = c.req.param('podcastId');
  const episodeId = c.req.param('episodeId');
  const body = await c.req.json();
  const data = updateEpisodeSchema.parse(body);

  const db = createDb(c.env.DB);

  const episode = await db.query.episodes.findFirst({
    where: and(eq(episodes.id, episodeId), eq(episodes.podcastId, podcastId)),
  });

  if (!episode) {
    throw new AppError(404, 'not_found', 'Episode not found');
  }

  // Check publish/schedule conditions
  const newStatus = data.status ?? episode.status;
  const newPublishedAt = data.published_at ?? episode.publishedAt;

  if (newStatus === 'published' || newStatus === 'scheduled') {
    const errors: Array<{ field: string; reason: string }> = [];
    if (!newPublishedAt) {
      errors.push({ field: 'published_at', reason: 'required' });
    }
    if (!episode.audioAssetId) {
      errors.push({ field: 'audio_asset_id', reason: 'required' });
    }
    // For scheduled, validate that publish date is in the future
    if (newStatus === 'scheduled' && newPublishedAt) {
      const publishDate = new Date(newPublishedAt);
      if (publishDate <= new Date()) {
        errors.push({ field: 'published_at', reason: 'must_be_future' });
      }
    }
    if (errors.length > 0) {
      const message = newStatus === 'scheduled'
        ? 'Cannot schedule episode without required fields'
        : 'Cannot publish episode without required fields';
      throw new AppError(422, 'publish_conditions_not_met', message, errors);
    }
  }

  const now = nowISO();
  const updateData: Record<string, unknown> = { updatedAt: now };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.published_at !== undefined) updateData.publishedAt = data.published_at;

  await db.update(episodes).set(updateData).where(eq(episodes.id, episodeId));

  // Return updated episode
  const updated = await db.query.episodes.findFirst({
    where: eq(episodes.id, episodeId),
  });

  let audio = null;
  if (updated?.audioAssetId) {
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, updated.audioAssetId),
    });
    if (asset) {
      audio = {
        asset_id: asset.id,
        public_url: asset.publicUrl,
        content_type: asset.contentType,
        byte_size: asset.byteSize,
      };
    }
  }

  return c.json({
    id: updated!.id,
    podcast_id: updated!.podcastId,
    title: updated!.title,
    description: updated!.description,
    status: updated!.status,
    published_at: updated!.publishedAt,
    audio_asset_id: updated!.audioAssetId,
    audio,
    duration_seconds: updated!.durationSeconds,
    created_at: updated!.createdAt,
    updated_at: updated!.updatedAt,
  });
});

// Delete episode
episodeRoutes.delete('/:episodeId', async (c) => {
  const podcastId = c.req.param('podcastId');
  const episodeId = c.req.param('episodeId');
  const db = createDb(c.env.DB);

  const episode = await db.query.episodes.findFirst({
    where: and(eq(episodes.id, episodeId), eq(episodes.podcastId, podcastId)),
  });

  if (!episode) {
    throw new AppError(404, 'not_found', 'Episode not found');
  }

  await db.delete(episodes).where(eq(episodes.id, episodeId));

  return c.body(null, 204);
});

// Attach audio to episode
episodeRoutes.post('/:episodeId/audio', async (c) => {
  const podcastId = c.req.param('podcastId');
  const episodeId = c.req.param('episodeId');
  const body = await c.req.json();
  const data = attachAudioSchema.parse(body);

  const db = createDb(c.env.DB);
  const userPlan = c.get('userPlan');

  const episode = await db.query.episodes.findFirst({
    where: and(eq(episodes.id, episodeId), eq(episodes.podcastId, podcastId)),
  });

  if (!episode) {
    throw new AppError(404, 'not_found', 'Episode not found');
  }

  // Check duration limit if provided
  if (data.duration_seconds) {
    const durationCheck = checkEpisodeDuration(data.duration_seconds, userPlan);
    if (!durationCheck.allowed) {
      throw new AppError(403, 'plan_limit_exceeded', durationCheck.reason ?? 'Duration limit exceeded', [
        { field: 'duration_seconds', reason: 'limit_exceeded', current: durationCheck.current, limit: durationCheck.limit },
      ]);
    }
  }

  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, data.audio_asset_id),
  });

  if (!asset) {
    throw new AppError(404, 'not_found', 'Asset not found');
  }

  if (asset.type !== 'audio') {
    throw new AppError(400, 'invalid_asset_type', 'Asset must be of type audio');
  }

  const now = nowISO();
  await db
    .update(episodes)
    .set({
      audioAssetId: data.audio_asset_id,
      durationSeconds: data.duration_seconds ?? null,
      updatedAt: now,
    })
    .where(eq(episodes.id, episodeId));

  return c.json({
    episode_id: episodeId,
    audio_asset_id: data.audio_asset_id,
    duration_seconds: data.duration_seconds ?? null,
  });
});
