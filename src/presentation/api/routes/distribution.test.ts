import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Distribution status schema
const updateStatusSchema = z.object({
  status: z.enum(['not_submitted', 'submitted', 'live', 'needs_attention']),
  note: z.string().optional().nullable(),
  last_checked_at: z.string().datetime().optional().nullable(),
});

describe('Distribution Schema Validation', () => {
  describe('updateStatusSchema', () => {
    it('should require status', () => {
      const result = updateStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should validate status enum', () => {
      const result = updateStatusSchema.safeParse({
        status: 'invalid_status',
      });
      expect(result.success).toBe(false);
    });

    it('should accept not_submitted status', () => {
      const result = updateStatusSchema.safeParse({
        status: 'not_submitted',
      });
      expect(result.success).toBe(true);
    });

    it('should accept submitted status', () => {
      const result = updateStatusSchema.safeParse({
        status: 'submitted',
      });
      expect(result.success).toBe(true);
    });

    it('should accept live status', () => {
      const result = updateStatusSchema.safeParse({
        status: 'live',
      });
      expect(result.success).toBe(true);
    });

    it('should accept needs_attention status', () => {
      const result = updateStatusSchema.safeParse({
        status: 'needs_attention',
      });
      expect(result.success).toBe(true);
    });

    it('should accept note', () => {
      const result = updateStatusSchema.safeParse({
        status: 'submitted',
        note: 'Submitted on 2026-01-25',
      });
      expect(result.success).toBe(true);
      expect(result.data?.note).toBe('Submitted on 2026-01-25');
    });

    it('should accept last_checked_at datetime', () => {
      const result = updateStatusSchema.safeParse({
        status: 'live',
        last_checked_at: '2026-01-25T12:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime format', () => {
      const result = updateStatusSchema.safeParse({
        status: 'live',
        last_checked_at: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Distribution Targets', () => {
  const targets = [
    { id: 'apple', name: 'Apple Podcasts', submitUrl: 'https://podcasters.apple.com/' },
    { id: 'spotify', name: 'Spotify', submitUrl: 'https://podcasters.spotify.com/' },
    { id: 'amazon', name: 'Amazon Music', submitUrl: 'https://podcasters.amazon.com/' },
  ];

  it('should have apple as a target', () => {
    const apple = targets.find((t) => t.id === 'apple');
    expect(apple).toBeDefined();
    expect(apple?.name).toBe('Apple Podcasts');
  });

  it('should have spotify as a target', () => {
    const spotify = targets.find((t) => t.id === 'spotify');
    expect(spotify).toBeDefined();
    expect(spotify?.name).toBe('Spotify');
  });

  it('should have amazon as a target', () => {
    const amazon = targets.find((t) => t.id === 'amazon');
    expect(amazon).toBeDefined();
    expect(amazon?.name).toBe('Amazon Music');
  });

  it('should have submit URLs for all targets', () => {
    for (const target of targets) {
      expect(target.submitUrl).toMatch(/^https:\/\//);
    }
  });
});

describe('Distribution Status Lifecycle', () => {
  const validTransitions: Record<string, string[]> = {
    not_submitted: ['submitted'],
    submitted: ['live', 'needs_attention'],
    live: ['needs_attention'],
    needs_attention: ['submitted', 'live'],
  };

  it('should allow transition from not_submitted to submitted', () => {
    const currentStatus = 'not_submitted';
    const newStatus = 'submitted';
    expect(validTransitions[currentStatus]).toContain(newStatus);
  });

  it('should allow transition from submitted to live', () => {
    const currentStatus = 'submitted';
    const newStatus = 'live';
    expect(validTransitions[currentStatus]).toContain(newStatus);
  });

  it('should allow transition from submitted to needs_attention', () => {
    const currentStatus = 'submitted';
    const newStatus = 'needs_attention';
    expect(validTransitions[currentStatus]).toContain(newStatus);
  });

  it('should allow fixing issues and resubmitting', () => {
    const currentStatus = 'needs_attention';
    const newStatus = 'submitted';
    expect(validTransitions[currentStatus]).toContain(newStatus);
  });
});
