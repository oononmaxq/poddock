import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Episode schema tests
const createEpisodeSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
  published_at: z.string().datetime().optional().nullable(),
});

const updateEpisodeSchema = createEpisodeSchema.partial();

const attachAudioSchema = z.object({
  audio_asset_id: z.string().min(1),
  duration_seconds: z.number().int().positive().optional(),
});

describe('Episode Schema Validation', () => {
  describe('createEpisodeSchema', () => {
    it('should require title', () => {
      const result = createEpisodeSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid episode data', () => {
      const result = createEpisodeSchema.safeParse({
        title: 'Episode 1',
      });
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('draft');
    });

    it('should accept episode with description', () => {
      const result = createEpisodeSchema.safeParse({
        title: 'Episode 1',
        description: 'This is the first episode',
      });
      expect(result.success).toBe(true);
    });

    it('should validate status enum', () => {
      const result = createEpisodeSchema.safeParse({
        title: 'Episode 1',
        status: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept published status with published_at', () => {
      const result = createEpisodeSchema.safeParse({
        title: 'Episode 1',
        status: 'published',
        published_at: '2026-01-25T12:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should validate published_at datetime format', () => {
      const result = createEpisodeSchema.safeParse({
        title: 'Episode 1',
        published_at: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateEpisodeSchema', () => {
    it('should allow partial updates', () => {
      const result = updateEpisodeSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty update', () => {
      const result = updateEpisodeSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('attachAudioSchema', () => {
    it('should require audio_asset_id', () => {
      const result = attachAudioSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid audio attachment', () => {
      const result = attachAudioSchema.safeParse({
        audio_asset_id: 'asset-123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept duration_seconds', () => {
      const result = attachAudioSchema.safeParse({
        audio_asset_id: 'asset-123',
        duration_seconds: 300,
      });
      expect(result.success).toBe(true);
      expect(result.data?.duration_seconds).toBe(300);
    });

    it('should reject negative duration', () => {
      const result = attachAudioSchema.safeParse({
        audio_asset_id: 'asset-123',
        duration_seconds: -10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer duration', () => {
      const result = attachAudioSchema.safeParse({
        audio_asset_id: 'asset-123',
        duration_seconds: 300.5,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Episode Business Rules', () => {
  it('should not allow publishing without audio', () => {
    // Business rule: Episode cannot be published without audio_asset_id
    const episode = {
      title: 'Episode 1',
      status: 'draft',
      audioAssetId: null,
      publishedAt: null,
    };

    const canPublish = (ep: typeof episode) => {
      return ep.audioAssetId !== null && ep.publishedAt !== null;
    };

    expect(canPublish(episode)).toBe(false);
  });

  it('should not allow publishing without published_at', () => {
    const episode = {
      title: 'Episode 1',
      status: 'draft',
      audioAssetId: 'asset-123',
      publishedAt: null,
    };

    const canPublish = (ep: typeof episode) => {
      return ep.audioAssetId !== null && ep.publishedAt !== null;
    };

    expect(canPublish(episode)).toBe(false);
  });

  it('should allow publishing with audio and published_at', () => {
    const episode = {
      title: 'Episode 1',
      status: 'draft',
      audioAssetId: 'asset-123',
      publishedAt: '2026-01-25T12:00:00Z',
    };

    const canPublish = (ep: typeof episode) => {
      return ep.audioAssetId !== null && ep.publishedAt !== null;
    };

    expect(canPublish(episode)).toBe(true);
  });
});
