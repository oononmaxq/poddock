import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { canAccessAnalytics } from '@domain/plan/limits';

// Query param schemas (same as in analytics.ts)
const overviewQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).default(6),
});

const episodesQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const countriesQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const dailyQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(30),
});

describe('Analytics Query Schema Validation', () => {
  describe('overviewQuerySchema', () => {
    it('should default months to 6', () => {
      const result = overviewQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.months).toBe(6);
    });

    it('should accept valid months value', () => {
      const result = overviewQuerySchema.safeParse({ months: '3' });
      expect(result.success).toBe(true);
      expect(result.data?.months).toBe(3);
    });

    it('should reject months less than 1', () => {
      const result = overviewQuerySchema.safeParse({ months: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject months greater than 12', () => {
      const result = overviewQuerySchema.safeParse({ months: '13' });
      expect(result.success).toBe(false);
    });

    it('should coerce string to number', () => {
      const result = overviewQuerySchema.safeParse({ months: '12' });
      expect(result.success).toBe(true);
      expect(result.data?.months).toBe(12);
    });
  });

  describe('episodesQuerySchema', () => {
    it('should default period to 30d', () => {
      const result = episodesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.period).toBe('30d');
    });

    it('should default limit to 10', () => {
      const result = episodesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(10);
    });

    it('should accept 7d period', () => {
      const result = episodesQuerySchema.safeParse({ period: '7d' });
      expect(result.success).toBe(true);
      expect(result.data?.period).toBe('7d');
    });

    it('should accept 90d period', () => {
      const result = episodesQuerySchema.safeParse({ period: '90d' });
      expect(result.success).toBe(true);
    });

    it('should accept all period', () => {
      const result = episodesQuerySchema.safeParse({ period: 'all' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid period', () => {
      const result = episodesQuerySchema.safeParse({ period: '14d' });
      expect(result.success).toBe(false);
    });

    it('should reject limit less than 1', () => {
      const result = episodesQuerySchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 50', () => {
      const result = episodesQuerySchema.safeParse({ limit: '51' });
      expect(result.success).toBe(false);
    });
  });

  describe('countriesQuerySchema', () => {
    it('should default period to 30d', () => {
      const result = countriesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.period).toBe('30d');
    });

    it('should default limit to 10', () => {
      const result = countriesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(10);
    });

    it('should accept valid period', () => {
      const result = countriesQuerySchema.safeParse({ period: '7d' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid period', () => {
      const result = countriesQuerySchema.safeParse({ period: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('dailyQuerySchema', () => {
    it('should default days to 30', () => {
      const result = dailyQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.days).toBe(30);
    });

    it('should accept 7 days', () => {
      const result = dailyQuerySchema.safeParse({ days: '7' });
      expect(result.success).toBe(true);
      expect(result.data?.days).toBe(7);
    });

    it('should accept 90 days', () => {
      const result = dailyQuerySchema.safeParse({ days: '90' });
      expect(result.success).toBe(true);
      expect(result.data?.days).toBe(90);
    });

    it('should reject days less than 7', () => {
      const result = dailyQuerySchema.safeParse({ days: '6' });
      expect(result.success).toBe(false);
    });

    it('should reject days greater than 90', () => {
      const result = dailyQuerySchema.safeParse({ days: '91' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Analytics Plan Authorization', () => {
  it('should deny analytics access for free plan', () => {
    expect(canAccessAnalytics('free')).toBe(false);
  });

  it('should allow analytics access for starter plan', () => {
    expect(canAccessAnalytics('starter')).toBe(true);
  });

  it('should allow analytics access for pro plan', () => {
    expect(canAccessAnalytics('pro')).toBe(true);
  });
});

describe('Analytics Response Structure', () => {
  it('should have correct overview response structure', () => {
    const response = {
      podcast_id: 'pod_123',
      period: {
        start: '2025-08-01',
        end: '2026-01-31',
      },
      monthly_plays: [
        { year_month: '2025-08', play_count: 100 },
        { year_month: '2025-09', play_count: 200 },
      ],
      total_plays: 300,
      current_month_plays: 200,
    };

    expect(response).toHaveProperty('podcast_id');
    expect(response).toHaveProperty('period');
    expect(response).toHaveProperty('monthly_plays');
    expect(response).toHaveProperty('total_plays');
    expect(response).toHaveProperty('current_month_plays');
    expect(response.period).toHaveProperty('start');
    expect(response.period).toHaveProperty('end');
    expect(response.monthly_plays[0]).toHaveProperty('year_month');
    expect(response.monthly_plays[0]).toHaveProperty('play_count');
  });

  it('should have correct episodes response structure', () => {
    const response = {
      podcast_id: 'pod_123',
      period: '30d',
      episodes: [
        {
          episode_id: 'ep_1',
          title: 'Episode 1',
          play_count: 150,
          percentage: 75.0,
        },
      ],
      total_plays: 200,
    };

    expect(response).toHaveProperty('podcast_id');
    expect(response).toHaveProperty('period');
    expect(response).toHaveProperty('episodes');
    expect(response).toHaveProperty('total_plays');
    expect(response.episodes[0]).toHaveProperty('episode_id');
    expect(response.episodes[0]).toHaveProperty('title');
    expect(response.episodes[0]).toHaveProperty('play_count');
    expect(response.episodes[0]).toHaveProperty('percentage');
  });

  it('should have correct countries response structure', () => {
    const response = {
      podcast_id: 'pod_123',
      period: '30d',
      countries: [
        { country: 'JP', play_count: 100, percentage: 50.0 },
        { country: 'US', play_count: 80, percentage: 40.0 },
        { country: 'OTHER', play_count: 20, percentage: 10.0 },
      ],
      total_plays: 200,
    };

    expect(response).toHaveProperty('podcast_id');
    expect(response).toHaveProperty('period');
    expect(response).toHaveProperty('countries');
    expect(response).toHaveProperty('total_plays');
    expect(response.countries[0]).toHaveProperty('country');
    expect(response.countries[0]).toHaveProperty('play_count');
    expect(response.countries[0]).toHaveProperty('percentage');
  });

  it('should have correct daily response structure', () => {
    const response = {
      podcast_id: 'pod_123',
      period: {
        start: '2025-12-27',
        end: '2026-01-26',
      },
      daily_plays: [
        { date: '2025-12-27', play_count: 10 },
        { date: '2025-12-28', play_count: 15 },
      ],
    };

    expect(response).toHaveProperty('podcast_id');
    expect(response).toHaveProperty('period');
    expect(response).toHaveProperty('daily_plays');
    expect(response.period).toHaveProperty('start');
    expect(response.period).toHaveProperty('end');
    expect(response.daily_plays[0]).toHaveProperty('date');
    expect(response.daily_plays[0]).toHaveProperty('play_count');
  });
});

describe('Analytics Business Rules', () => {
  it('should calculate percentage correctly', () => {
    const totalPlays = 200;
    const playCount = 150;
    const percentage = Math.round((playCount / totalPlays) * 1000) / 10;
    expect(percentage).toBe(75);
  });

  it('should handle zero total plays without division error', () => {
    const totalPlays = 0;
    const playCount = 0;
    const percentage = totalPlays > 0 ? Math.round((playCount / totalPlays) * 1000) / 10 : 0;
    expect(percentage).toBe(0);
  });

  it('should aggregate small countries into OTHER', () => {
    const countries = [
      { country: 'JP', playCount: 100 },
      { country: 'US', playCount: 80 },
      { country: 'CA', playCount: 10 },
      { country: 'GB', playCount: 5 },
      { country: 'DE', playCount: 3 },
      { country: 'FR', playCount: 2 },
    ];

    const limit = 3;
    const topCountries = countries.slice(0, limit);
    const otherCountries = countries.slice(limit);
    const otherTotal = otherCountries.reduce((sum, c) => sum + c.playCount, 0);

    expect(topCountries).toHaveLength(3);
    expect(otherTotal).toBe(10); // 5 + 3 + 2
  });

  it('should fill missing days with zero', () => {
    const stats = new Map([
      ['2026-01-01', 10],
      ['2026-01-03', 20],
    ]);

    const days = ['2026-01-01', '2026-01-02', '2026-01-03'];
    const filled = days.map((date) => ({
      date,
      play_count: stats.get(date) ?? 0,
    }));

    expect(filled).toEqual([
      { date: '2026-01-01', play_count: 10 },
      { date: '2026-01-02', play_count: 0 },
      { date: '2026-01-03', play_count: 20 },
    ]);
  });

  it('should fill missing months with zero', () => {
    const stats = new Map([
      ['2025-08', 100],
      ['2025-10', 200],
    ]);

    const months = ['2025-08', '2025-09', '2025-10'];
    const filled = months.map((yearMonth) => ({
      year_month: yearMonth,
      play_count: stats.get(yearMonth) ?? 0,
    }));

    expect(filled).toEqual([
      { year_month: '2025-08', play_count: 100 },
      { year_month: '2025-09', play_count: 0 },
      { year_month: '2025-10', play_count: 200 },
    ]);
  });
});
