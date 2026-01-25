import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { createDb } from '../../../infrastructure/db/client';
import { podcasts, episodes, assets } from '../../../infrastructure/db/schema';
import type { AppEnv } from '../types';

const publicRoutes = new Hono<AppEnv>();

// Get public podcast by ID
publicRoutes.get('/podcasts/:podcastId', async (c) => {
  const { podcastId } = c.req.param();
  const db = createDb(c.env.DB);

  const podcast = await db
    .select({
      id: podcasts.id,
      title: podcasts.title,
      description: podcasts.description,
      language: podcasts.language,
      category: podcasts.category,
      author_name: podcasts.authorName,
      visibility: podcasts.visibility,
      theme_color: podcasts.themeColor,
      theme_mode: podcasts.themeMode,
      cover_image_asset_id: podcasts.coverImageAssetId,
    })
    .from(podcasts)
    .where(and(eq(podcasts.id, podcastId), eq(podcasts.visibility, 'public')))
    .get();

  if (!podcast) {
    return c.json({ error: 'NOT_FOUND', message: 'Podcast not found' }, 404);
  }

  // Get cover image if exists
  let coverImage = null;
  if (podcast.cover_image_asset_id) {
    coverImage = await db
      .select({
        public_url: assets.publicUrl,
      })
      .from(assets)
      .where(eq(assets.id, podcast.cover_image_asset_id))
      .get();
  }

  return c.json({
    ...podcast,
    cover_image: coverImage,
  });
});

// Get public episodes for a podcast
publicRoutes.get('/podcasts/:podcastId/episodes', async (c) => {
  const { podcastId } = c.req.param();
  const db = createDb(c.env.DB);

  // First check if podcast is public
  const podcast = await db
    .select({ visibility: podcasts.visibility })
    .from(podcasts)
    .where(eq(podcasts.id, podcastId))
    .get();

  if (!podcast || podcast.visibility !== 'public') {
    return c.json({ error: 'NOT_FOUND', message: 'Podcast not found' }, 404);
  }

  // Get published episodes only
  const episodeList = await db
    .select({
      id: episodes.id,
      title: episodes.title,
      description: episodes.description,
      published_at: episodes.publishedAt,
      duration_seconds: episodes.durationSeconds,
      audio_asset_id: episodes.audioAssetId,
    })
    .from(episodes)
    .where(and(eq(episodes.podcastId, podcastId), eq(episodes.status, 'published')))
    .orderBy(desc(episodes.publishedAt));

  // Get audio URLs for each episode
  const items = await Promise.all(
    episodeList.map(async (episode) => {
      let audio = null;
      if (episode.audio_asset_id) {
        audio = await db
          .select({ public_url: assets.publicUrl })
          .from(assets)
          .where(eq(assets.id, episode.audio_asset_id))
          .get();
      }
      return {
        ...episode,
        audio,
      };
    })
  );

  return c.json({ items });
});

// Get single public episode
publicRoutes.get('/podcasts/:podcastId/episodes/:episodeId', async (c) => {
  const { podcastId, episodeId } = c.req.param();
  const db = createDb(c.env.DB);

  // First check if podcast is public
  const podcast = await db
    .select({ visibility: podcasts.visibility })
    .from(podcasts)
    .where(eq(podcasts.id, podcastId))
    .get();

  if (!podcast || podcast.visibility !== 'public') {
    return c.json({ error: 'NOT_FOUND', message: 'Podcast not found' }, 404);
  }

  // Get published episode
  const episode = await db
    .select({
      id: episodes.id,
      title: episodes.title,
      description: episodes.description,
      status: episodes.status,
      published_at: episodes.publishedAt,
      duration_seconds: episodes.durationSeconds,
      audio_asset_id: episodes.audioAssetId,
    })
    .from(episodes)
    .where(
      and(
        eq(episodes.id, episodeId),
        eq(episodes.podcastId, podcastId),
        eq(episodes.status, 'published')
      )
    )
    .get();

  if (!episode) {
    return c.json({ error: 'NOT_FOUND', message: 'Episode not found' }, 404);
  }

  // Get audio URL
  let audio = null;
  if (episode.audio_asset_id) {
    audio = await db
      .select({ public_url: assets.publicUrl })
      .from(assets)
      .where(eq(assets.id, episode.audio_asset_id))
      .get();
  }

  return c.json({
    ...episode,
    audio,
  });
});

export { publicRoutes };
