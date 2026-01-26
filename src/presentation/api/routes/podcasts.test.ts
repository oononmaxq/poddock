import { describe, it, expect } from 'vitest';
import { z } from 'zod';

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

describe('Podcast Schema Validation', () => {
  describe('createPodcastSchema', () => {
    it('should require title', () => {
      const result = createPodcastSchema.safeParse({
        description: 'A test podcast',
        category: 'Technology',
      });
      expect(result.success).toBe(false);
    });

    it('should require description', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test Podcast',
        category: 'Technology',
      });
      expect(result.success).toBe(false);
    });

    it('should require category', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test Podcast',
        description: 'A test podcast',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid podcast data', () => {
      const result = createPodcastSchema.safeParse({
        title: 'My Podcast',
        description: 'A great podcast',
        category: 'Technology',
      });
      expect(result.success).toBe(true);
      expect(result.data?.language).toBe('ja');
      expect(result.data?.visibility).toBe('private');
      expect(result.data?.explicit).toBe(false);
    });

    it('should validate visibility enum', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        visibility: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should validate podcast_type enum', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        podcast_type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept episodic podcast type', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        podcast_type: 'episodic',
      });
      expect(result.success).toBe(true);
    });

    it('should accept serial podcast type', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        podcast_type: 'serial',
      });
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        contact_email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid email', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        contact_email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should convert empty email to null', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        contact_email: '',
      });
      expect(result.success).toBe(true);
      expect(result.data?.contact_email).toBeNull();
    });

    it('should validate theme_color format', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        theme_color: 'not-a-color',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid hex color', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        theme_color: '#ff5500',
      });
      expect(result.success).toBe(true);
      expect(result.data?.theme_color).toBe('#ff5500');
    });

    it('should use default theme_color when empty', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        theme_color: '',
      });
      expect(result.success).toBe(true);
      expect(result.data?.theme_color).toBe('#6366f1');
    });

    it('should validate theme_mode enum', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        theme_mode: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept light theme mode', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        theme_mode: 'light',
      });
      expect(result.success).toBe(true);
    });

    it('should accept dark theme mode', () => {
      const result = createPodcastSchema.safeParse({
        title: 'Test',
        description: 'Test',
        category: 'Tech',
        theme_mode: 'dark',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updatePodcastSchema', () => {
    it('should allow partial updates', () => {
      const result = updatePodcastSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty update', () => {
      const result = updatePodcastSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should still validate field constraints', () => {
      const result = updatePodcastSchema.safeParse({
        title: '', // Empty title not allowed
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Podcast Business Rules', () => {
  it('should default to private visibility', () => {
    const result = createPodcastSchema.safeParse({
      title: 'Test',
      description: 'Test',
      category: 'Tech',
    });
    expect(result.data?.visibility).toBe('private');
  });

  it('should default to episodic type', () => {
    const result = createPodcastSchema.safeParse({
      title: 'Test',
      description: 'Test',
      category: 'Tech',
    });
    expect(result.data?.podcast_type).toBe('episodic');
  });

  it('should default to non-explicit', () => {
    const result = createPodcastSchema.safeParse({
      title: 'Test',
      description: 'Test',
      category: 'Tech',
    });
    expect(result.data?.explicit).toBe(false);
  });

  it('should default language to Japanese', () => {
    const result = createPodcastSchema.safeParse({
      title: 'Test',
      description: 'Test',
      category: 'Tech',
    });
    expect(result.data?.language).toBe('ja');
  });
});

describe('Amazon Validation', () => {
  it('should require contact_email for Amazon submission', () => {
    const podcast = {
      title: 'Test Podcast',
      description: 'Test Description',
      language: 'ja',
      category: 'Technology',
      contactEmail: null,
    };

    const validateForAmazon = (p: typeof podcast) => {
      const errors: string[] = [];
      if (!p.contactEmail) {
        errors.push('contact_email is required for Amazon');
      }
      return errors;
    };

    const errors = validateForAmazon(podcast);
    expect(errors).toContain('contact_email is required for Amazon');
  });

  it('should pass Amazon validation with contact_email', () => {
    const podcast = {
      title: 'Test Podcast',
      description: 'Test Description',
      language: 'ja',
      category: 'Technology',
      contactEmail: 'test@example.com',
    };

    const validateForAmazon = (p: typeof podcast) => {
      const errors: string[] = [];
      if (!p.contactEmail) {
        errors.push('contact_email is required for Amazon');
      }
      return errors;
    };

    const errors = validateForAmazon(podcast);
    expect(errors).toHaveLength(0);
  });
});
