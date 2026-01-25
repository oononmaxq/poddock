import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import { assets } from '@infrastructure/db/schema';
import { generateId } from '@infrastructure/utils/id';
import { nowISO } from '@infrastructure/utils/date';

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const uploadUrlSchema = z.object({
  type: z.enum(['audio', 'image']),
  file_name: z.string().min(1),
  content_type: z.string().min(1),
  byte_size: z.number().positive(),
});

const completeUploadSchema = z.object({
  checksum: z.string().optional(),
});

export const assetRoutes = new Hono<AppEnv>();

// Request upload URL
assetRoutes.post('/upload-url', async (c) => {
  const body = await c.req.json();
  const data = uploadUrlSchema.parse(body);

  // Validate content type
  const allowedTypes = data.type === 'audio' ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
  if (!allowedTypes.includes(data.content_type)) {
    throw new AppError(400, 'invalid_content_type', `Content type must be one of: ${allowedTypes.join(', ')}`, [
      { field: 'content_type', reason: `must be one of: ${allowedTypes.join(', ')}` },
    ]);
  }

  const assetId = generateId();
  const ext = data.file_name.split('.').pop() || '';
  const storageKey = `${data.type}/${assetId}${ext ? '.' + ext : ''}`;

  // Create presigned URL for R2
  const bucket = c.env.BUCKET;
  const r2PublicUrl = c.env.R2_PUBLIC_URL;

  // Create a multipart upload URL
  // Note: In production, you would use bucket.createMultipartUpload() for large files
  // For MVP, we use a simple signed URL approach

  // Generate a temporary upload URL (expires in 15 minutes)
  const expiresIn = 900; // 15 minutes

  // Store asset metadata as pending
  const db = createDb(c.env.DB);
  const now = nowISO();

  await db.insert(assets).values({
    id: assetId,
    type: data.type,
    storageProvider: 'r2',
    storageBucket: 'poddock-bucket',
    storageKey,
    publicUrl: `${r2PublicUrl}/${storageKey}`,
    contentType: data.content_type,
    byteSize: data.byte_size,
    checksum: null,
    createdAt: now,
  });

  // For R2 direct upload, we need to create a signed URL
  // In Cloudflare Workers, we can use the bucket binding directly
  // The client will PUT directly to R2

  // Note: R2 presigned URLs require the R2 API, which needs additional setup
  // For MVP, we'll use a simplified approach where the worker proxies small uploads
  // or the client uses the R2 public bucket with CORS

  return c.json(
    {
      asset_id: assetId,
      upload: {
        method: 'PUT',
        url: `/api/assets/${assetId}/upload`,
        headers: {
          'Content-Type': data.content_type,
        },
        expires_in: expiresIn,
      },
    },
    201
  );
});

// Direct upload to worker (proxy to R2)
assetRoutes.put('/:assetId/upload', async (c) => {
  const assetId = c.req.param('assetId');
  const db = createDb(c.env.DB);

  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, assetId),
  });

  if (!asset) {
    throw new AppError(404, 'not_found', 'Asset not found');
  }

  const body = await c.req.arrayBuffer();
  const bucket = c.env.BUCKET;

  await bucket.put(asset.storageKey, body, {
    httpMetadata: {
      contentType: asset.contentType,
    },
  });

  return c.json({ message: 'Upload successful' });
});

// Complete upload
assetRoutes.post('/:assetId/complete', async (c) => {
  const assetId = c.req.param('assetId');
  const body = await c.req.json();
  const data = completeUploadSchema.parse(body);

  const db = createDb(c.env.DB);

  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, assetId),
  });

  if (!asset) {
    throw new AppError(404, 'not_found', 'Asset not found');
  }

  // Verify the file exists in R2
  const bucket = c.env.BUCKET;
  const object = await bucket.head(asset.storageKey);

  if (!object) {
    throw new AppError(400, 'upload_not_found', 'Upload not found in storage');
  }

  // Update checksum if provided
  if (data.checksum) {
    await db
      .update(assets)
      .set({ checksum: data.checksum })
      .where(eq(assets.id, assetId));
  }

  return c.json({
    id: asset.id,
    type: asset.type,
    public_url: asset.publicUrl,
    content_type: asset.contentType,
    byte_size: asset.byteSize,
    created_at: asset.createdAt,
  });
});
