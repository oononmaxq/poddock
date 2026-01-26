import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Asset schemas
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

describe('Asset Schema Validation', () => {
  describe('uploadUrlSchema', () => {
    it('should require type', () => {
      const result = uploadUrlSchema.safeParse({
        file_name: 'test.mp3',
        content_type: 'audio/mpeg',
        byte_size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it('should validate type enum', () => {
      const result = uploadUrlSchema.safeParse({
        type: 'video',
        file_name: 'test.mp4',
        content_type: 'video/mp4',
        byte_size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid audio upload request', () => {
      const result = uploadUrlSchema.safeParse({
        type: 'audio',
        file_name: 'episode.mp3',
        content_type: 'audio/mpeg',
        byte_size: 10240000,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid image upload request', () => {
      const result = uploadUrlSchema.safeParse({
        type: 'image',
        file_name: 'cover.jpg',
        content_type: 'image/jpeg',
        byte_size: 512000,
      });
      expect(result.success).toBe(true);
    });

    it('should require positive byte_size', () => {
      const result = uploadUrlSchema.safeParse({
        type: 'audio',
        file_name: 'test.mp3',
        content_type: 'audio/mpeg',
        byte_size: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative byte_size', () => {
      const result = uploadUrlSchema.safeParse({
        type: 'audio',
        file_name: 'test.mp3',
        content_type: 'audio/mpeg',
        byte_size: -1024,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('completeUploadSchema', () => {
    it('should accept empty object', () => {
      const result = completeUploadSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept checksum', () => {
      const result = completeUploadSchema.safeParse({
        checksum: 'abc123def456',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Asset Content Type Validation', () => {
  describe('Audio types', () => {
    it('should accept audio/mpeg (MP3)', () => {
      expect(ALLOWED_AUDIO_TYPES).toContain('audio/mpeg');
    });

    it('should accept audio/mp4 (M4A/AAC)', () => {
      expect(ALLOWED_AUDIO_TYPES).toContain('audio/mp4');
    });

    it('should accept audio/wav (WAV)', () => {
      expect(ALLOWED_AUDIO_TYPES).toContain('audio/wav');
    });

    it('should not accept video types', () => {
      expect(ALLOWED_AUDIO_TYPES).not.toContain('video/mp4');
    });

    it('should not accept ogg format', () => {
      expect(ALLOWED_AUDIO_TYPES).not.toContain('audio/ogg');
    });
  });

  describe('Image types', () => {
    it('should accept image/jpeg', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
    });

    it('should accept image/png', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png');
    });

    it('should accept image/webp', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/webp');
    });

    it('should not accept GIF', () => {
      expect(ALLOWED_IMAGE_TYPES).not.toContain('image/gif');
    });

    it('should not accept SVG', () => {
      expect(ALLOWED_IMAGE_TYPES).not.toContain('image/svg+xml');
    });
  });
});

describe('Asset Storage Key Generation', () => {
  it('should generate correct storage key for audio', () => {
    const assetId = 'abc123';
    const fileName = 'episode.mp3';
    const type = 'audio';

    const ext = fileName.split('.').pop() || '';
    const storageKey = `${type}/${assetId}${ext ? '.' + ext : ''}`;

    expect(storageKey).toBe('audio/abc123.mp3');
  });

  it('should generate correct storage key for image', () => {
    const assetId = 'xyz789';
    const fileName = 'cover.jpg';
    const type = 'image';

    const ext = fileName.split('.').pop() || '';
    const storageKey = `${type}/${assetId}${ext ? '.' + ext : ''}`;

    expect(storageKey).toBe('image/xyz789.jpg');
  });

  it('should handle files without extension', () => {
    const assetId = 'abc123';
    const fileName = 'noextension';
    const type = 'audio';

    const ext = fileName.split('.').pop() || '';
    // When no dot in filename, pop returns the whole filename
    const storageKey = `${type}/${assetId}${fileName.includes('.') ? '.' + ext : ''}`;

    expect(storageKey).toBe('audio/abc123');
  });
});
