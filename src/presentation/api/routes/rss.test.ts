import { describe, it, expect } from 'vitest';

// Test helper functions from RSS generation
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

describe('RSS Helper Functions', () => {
  describe('escapeXml', () => {
    it('should escape ampersands', () => {
      expect(escapeXml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape angle brackets', () => {
      expect(escapeXml('<script>')).toBe('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      expect(escapeXml('Say "Hello"')).toBe('Say &quot;Hello&quot;');
    });

    it('should escape apostrophes', () => {
      expect(escapeXml("It's\"quite")).toBe('It&#39;s&quot;quite');
    });

    it('should handle multiple special characters', () => {
      expect(escapeXml('A & B < C > D "E" \'F\'')).toBe(
        'A &amp; B &lt; C &gt; D &quot;E&quot; &#39;F&#39;'
      );
    });

    it('should return same string if no special characters', () => {
      expect(escapeXml('Hello World')).toBe('Hello World');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('0:45');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2:05');
    });

    it('should format hours, minutes and seconds', () => {
      expect(formatDuration(3661)).toBe('1:01:01');
    });

    it('should pad minutes and seconds with zeros', () => {
      expect(formatDuration(7265)).toBe('2:01:05');
    });

    it('should handle exact hours', () => {
      expect(formatDuration(3600)).toBe('1:00:00');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0:00');
    });
  });
});

describe('RSS Validation', () => {
  it('should require contact_email for Amazon', () => {
    const podcast = {
      title: 'Test Podcast',
      description: 'Test Description',
      language: 'ja',
      category: 'Technology',
      contactEmail: null,
    };

    const amazonErrors = validateForAmazon(podcast);
    expect(amazonErrors).toContainEqual(
      expect.objectContaining({ code: 'missing_itunes_email' })
    );
  });

  it('should pass Amazon validation with contact_email', () => {
    const podcast = {
      title: 'Test Podcast',
      description: 'Test Description',
      language: 'ja',
      category: 'Technology',
      contactEmail: 'contact@example.com',
    };

    const amazonErrors = validateForAmazon(podcast);
    expect(amazonErrors).toHaveLength(0);
  });
});

// Simple validation helper for testing
interface PodcastData {
  title: string;
  description: string;
  language: string;
  category: string;
  contactEmail: string | null;
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

function validateForAmazon(podcast: PodcastData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!podcast.contactEmail) {
    errors.push({
      code: 'missing_itunes_email',
      message: 'Amazon requires contact email',
      field: 'contact_email',
    });
  }

  return errors;
}
