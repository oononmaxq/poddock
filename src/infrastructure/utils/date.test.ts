import { describe, it, expect } from 'vitest';
import { nowISO, formatRFC2822 } from './date';

describe('nowISO', () => {
  it('should return a valid ISO 8601 string', () => {
    const result = nowISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('formatRFC2822', () => {
  it('should format date correctly', () => {
    const date = new Date('2026-01-24T03:00:00Z');
    const result = formatRFC2822(date);
    expect(result).toBe('Sat, 24 Jan 2026 03:00:00 GMT');
  });

  it('should handle single digit day', () => {
    const date = new Date('2026-01-05T12:30:45Z');
    const result = formatRFC2822(date);
    expect(result).toBe('Mon, 05 Jan 2026 12:30:45 GMT');
  });

  it('should handle different months', () => {
    const date = new Date('2026-12-25T00:00:00Z');
    const result = formatRFC2822(date);
    expect(result).toBe('Fri, 25 Dec 2026 00:00:00 GMT');
  });
});
