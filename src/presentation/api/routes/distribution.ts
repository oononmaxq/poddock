import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import {
  podcasts,
  distributionStatuses,
  distributionTargets,
} from '@infrastructure/db/schema';
import { nowISO } from '@infrastructure/utils/date';

const updateStatusSchema = z.object({
  status: z.enum(['not_submitted', 'submitted', 'live', 'needs_attention']),
  note: z.string().optional().nullable(),
  last_checked_at: z.string().datetime().optional().nullable(),
});

export const distributionRoutes = new Hono<AppEnv>();

// List distribution statuses
distributionRoutes.get('/', async (c) => {
  const podcastId = c.req.param('podcastId');
  const db = createDb(c.env.DB);

  // Verify podcast exists
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  // Get all distribution targets
  const allTargets = await db.select().from(distributionTargets);

  // Get existing statuses
  const existingStatuses = await db
    .select({
      status: distributionStatuses,
      target: distributionTargets,
    })
    .from(distributionStatuses)
    .innerJoin(distributionTargets, eq(distributionStatuses.targetId, distributionTargets.id))
    .where(eq(distributionStatuses.podcastId, podcastId));

  const existingTargetIds = new Set(existingStatuses.map((s) => s.target.id));

  // Create missing distribution statuses (for new targets like YouTube Music)
  const now = nowISO();
  for (const target of allTargets) {
    if (!existingTargetIds.has(target.id)) {
      const { generateId } = await import('@infrastructure/utils/id');
      await db.insert(distributionStatuses).values({
        id: generateId(),
        podcastId,
        targetId: target.id,
        status: 'not_submitted',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Re-fetch all statuses after creating missing ones
  const statuses = await db
    .select({
      status: distributionStatuses,
      target: distributionTargets,
    })
    .from(distributionStatuses)
    .innerJoin(distributionTargets, eq(distributionStatuses.targetId, distributionTargets.id))
    .where(eq(distributionStatuses.podcastId, podcastId));

  const items = statuses.map(({ status, target }) => ({
    target_id: target.id,
    target_name: target.name,
    status: status.status,
    note: status.note,
    submit_url: target.submitUrl,
    last_checked_at: status.lastCheckedAt,
    updated_at: status.updatedAt,
  }));

  return c.json({ items });
});

// Update distribution status
distributionRoutes.patch('/:targetId', async (c) => {
  const podcastId = c.req.param('podcastId');
  const targetId = c.req.param('targetId');
  const body = await c.req.json();
  const data = updateStatusSchema.parse(body);

  const db = createDb(c.env.DB);

  // Verify podcast exists
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  // Find existing status
  const existing = await db.query.distributionStatuses.findFirst({
    where: and(
      eq(distributionStatuses.podcastId, podcastId),
      eq(distributionStatuses.targetId, targetId)
    ),
  });

  if (!existing) {
    throw new AppError(404, 'not_found', 'Distribution status not found');
  }

  const now = nowISO();
  const updateData: Record<string, unknown> = {
    status: data.status,
    updatedAt: now,
  };

  if (data.note !== undefined) updateData.note = data.note;
  if (data.last_checked_at !== undefined) updateData.lastCheckedAt = data.last_checked_at;

  await db
    .update(distributionStatuses)
    .set(updateData)
    .where(eq(distributionStatuses.id, existing.id));

  return c.json({
    target_id: targetId,
    status: data.status,
    note: data.note ?? existing.note,
    last_checked_at: data.last_checked_at ?? existing.lastCheckedAt,
    updated_at: now,
  });
});
