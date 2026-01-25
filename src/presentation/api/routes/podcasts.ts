import { Hono } from 'hono';
import { z } from 'zod';
import { eq, sql, and } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import {
  podcasts,
  episodes,
  feedTokens,
  distributionStatuses,
  distributionTargets,
  assets,
} from '@infrastructure/db/schema';
import { generateId } from '@infrastructure/utils/id';
import { nowISO } from '@infrastructure/utils/date';
import { episodeRoutes } from './episodes';
import { distributionRoutes } from './distribution';
import { feedTokenRoutes } from './feed-token';
import { validateRoutes } from './validate';

// Helper for optional email that allows empty string
const optionalEmail = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().email().nullable().optional()
);

// Helper for optional string that allows empty string
const optionalString = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().nullable().optional()
);

const createPodcastSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  language: z.string().min(2).max(10).default('ja'),
  category: z.string().min(1).max(100),
  author_name: optionalString,
  contact_email: optionalEmail,
  explicit: z.boolean().default(false),
  podcast_type: z.enum(['episodic', 'serial']).default('episodic'),
  visibility: z.enum(['public', 'private']).default('private'),
  cover_image_asset_id: optionalString,
  theme_color: z.preprocess(
    (val) => (val === null || val === '' ? '#6366f1' : val),
    z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1')
  ),
  theme_mode: z.preprocess(
    (val) => (val === null || val === '' ? 'light' : val),
    z.enum(['light', 'dark']).default('light')
  ),
});

const updatePodcastSchema = createPodcastSchema.partial();

export const podcastRoutes = new Hono<AppEnv>();

// Nested routes
podcastRoutes.route('/:podcastId/episodes', episodeRoutes);
podcastRoutes.route('/:podcastId/distribution-statuses', distributionRoutes);
podcastRoutes.route('/:podcastId/feed-token', feedTokenRoutes);
podcastRoutes.route('/:podcastId/rss', validateRoutes);

// List podcasts
podcastRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const q = c.req.query('q');
  const visibility = c.req.query('visibility');
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);

  let query = db.select().from(podcasts);

  // Note: Basic filtering, cursor pagination can be added later
  const results = await query.limit(limit);

  const items = await Promise.all(
    results.map(async (podcast) => {
      const counts = await db
        .select({
          status: episodes.status,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(episodes)
        .where(eq(episodes.podcastId, podcast.id))
        .groupBy(episodes.status);

      const episodeCounts = {
        draft: 0,
        published: 0,
      };
      for (const row of counts) {
        if (row.status === 'draft' || row.status === 'published') {
          episodeCounts[row.status] = Number(row.count);
        }
      }

      // Get cover image URL
      let coverImageUrl: string | null = null;
      if (podcast.coverImageAssetId) {
        const [coverAsset] = await db
          .select()
          .from(assets)
          .where(eq(assets.id, podcast.coverImageAssetId))
          .limit(1);
        if (coverAsset) {
          coverImageUrl = coverAsset.publicUrl;
        }
      }

      return {
        id: podcast.id,
        title: podcast.title,
        visibility: podcast.visibility,
        cover_image_url: coverImageUrl,
        episode_counts: episodeCounts,
        updated_at: podcast.updatedAt,
      };
    })
  );

  return c.json({ items, next_cursor: null });
});

// Create podcast
podcastRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const data = createPodcastSchema.parse(body);

  const db = createDb(c.env.DB);
  const now = nowISO();
  const podcastId = generateId();
  const feedTokenId = generateId();
  const token = generateId(); // Use as private feed token

  // Create feed token first
  await db.insert(feedTokens).values({
    id: feedTokenId,
    podcastId,
    token,
    createdAt: now,
  });

  // Create podcast
  await db.insert(podcasts).values({
    id: podcastId,
    title: data.title,
    description: data.description,
    language: data.language,
    category: data.category,
    authorName: data.author_name ?? null,
    contactEmail: data.contact_email ?? null,
    explicit: data.explicit,
    podcastType: data.podcast_type,
    visibility: data.visibility,
    coverImageAssetId: data.cover_image_asset_id ?? null,
    privateFeedTokenId: feedTokenId,
    themeColor: data.theme_color,
    themeMode: data.theme_mode,
    createdAt: now,
    updatedAt: now,
  });

  // Create distribution statuses for all targets
  const targets = await db.select().from(distributionTargets);
  for (const target of targets) {
    await db.insert(distributionStatuses).values({
      id: generateId(),
      podcastId,
      targetId: target.id,
      status: 'not_submitted',
      createdAt: now,
      updatedAt: now,
    });
  }

  const baseUrl = c.env.BASE_URL;

  return c.json(
    {
      id: podcastId,
      title: data.title,
      visibility: data.visibility,
      public_rss_url: `${baseUrl}/rss/${podcastId}.xml`,
      private_rss_url: `${baseUrl}/rss/${podcastId}.xml?token=${token}`,
      created_at: now,
      updated_at: now,
    },
    201
  );
});

// Get podcast
podcastRoutes.get('/:podcastId', async (c) => {
  const podcastId = c.req.param('podcastId');
  const db = createDb(c.env.DB);

  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  const feedToken = podcast.privateFeedTokenId
    ? await db.query.feedTokens.findFirst({
        where: eq(feedTokens.id, podcast.privateFeedTokenId),
      })
    : null;

  // Get cover image URL if exists
  let coverImageUrl: string | null = null;
  if (podcast.coverImageAssetId) {
    const [coverAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, podcast.coverImageAssetId))
      .limit(1);
    if (coverAsset) {
      coverImageUrl = coverAsset.publicUrl;
    }
  }

  const baseUrl = c.env.BASE_URL;

  return c.json({
    id: podcast.id,
    title: podcast.title,
    description: podcast.description,
    language: podcast.language,
    category: podcast.category,
    author_name: podcast.authorName,
    contact_email: podcast.contactEmail,
    explicit: podcast.explicit,
    podcast_type: podcast.podcastType,
    visibility: podcast.visibility,
    cover_image_asset_id: podcast.coverImageAssetId,
    cover_image_url: coverImageUrl,
    theme_color: podcast.themeColor,
    theme_mode: podcast.themeMode,
    public_rss_url: `${baseUrl}/rss/${podcast.id}.xml`,
    private_rss_url: feedToken
      ? `${baseUrl}/rss/${podcast.id}.xml?token=${feedToken.token}`
      : null,
    public_website_url: `${baseUrl}/p/${podcast.id}`,
    created_at: podcast.createdAt,
    updated_at: podcast.updatedAt,
  });
});

// Update podcast
podcastRoutes.patch('/:podcastId', async (c) => {
  const podcastId = c.req.param('podcastId');
  const body = await c.req.json();
  const data = updatePodcastSchema.parse(body);

  const db = createDb(c.env.DB);

  const existing = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  if (!existing) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  const now = nowISO();
  const updateData: Record<string, unknown> = { updatedAt: now };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.author_name !== undefined) updateData.authorName = data.author_name;
  if (data.contact_email !== undefined) updateData.contactEmail = data.contact_email;
  if (data.explicit !== undefined) updateData.explicit = data.explicit;
  if (data.podcast_type !== undefined) updateData.podcastType = data.podcast_type;
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.cover_image_asset_id !== undefined)
    updateData.coverImageAssetId = data.cover_image_asset_id;
  if (data.theme_color !== undefined) updateData.themeColor = data.theme_color;
  if (data.theme_mode !== undefined) updateData.themeMode = data.theme_mode;

  await db.update(podcasts).set(updateData).where(eq(podcasts.id, podcastId));

  // Return updated podcast
  const updated = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  const feedToken = updated?.privateFeedTokenId
    ? await db.query.feedTokens.findFirst({
        where: eq(feedTokens.id, updated.privateFeedTokenId),
      })
    : null;

  // Get cover image URL if exists
  let coverImageUrl: string | null = null;
  if (updated?.coverImageAssetId) {
    const [coverAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, updated.coverImageAssetId))
      .limit(1);
    if (coverAsset) {
      coverImageUrl = coverAsset.publicUrl;
    }
  }

  const baseUrl = c.env.BASE_URL;

  return c.json({
    id: updated!.id,
    title: updated!.title,
    description: updated!.description,
    language: updated!.language,
    category: updated!.category,
    author_name: updated!.authorName,
    contact_email: updated!.contactEmail,
    explicit: updated!.explicit,
    podcast_type: updated!.podcastType,
    visibility: updated!.visibility,
    cover_image_asset_id: updated!.coverImageAssetId,
    cover_image_url: coverImageUrl,
    theme_color: updated!.themeColor,
    theme_mode: updated!.themeMode,
    public_rss_url: `${baseUrl}/rss/${updated!.id}.xml`,
    private_rss_url: feedToken
      ? `${baseUrl}/rss/${updated!.id}.xml?token=${feedToken.token}`
      : null,
    public_website_url: `${baseUrl}/p/${updated!.id}`,
    created_at: updated!.createdAt,
    updated_at: updated!.updatedAt,
  });
});

// Delete podcast
podcastRoutes.delete('/:podcastId', async (c) => {
  const podcastId = c.req.param('podcastId');
  const db = createDb(c.env.DB);

  const existing = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  if (!existing) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  // Delete podcast (episodes and distribution statuses cascade)
  await db.delete(podcasts).where(eq(podcasts.id, podcastId));

  // Delete feed token if exists
  if (existing.privateFeedTokenId) {
    await db.delete(feedTokens).where(eq(feedTokens.id, existing.privateFeedTokenId));
  }

  return c.body(null, 204);
});
