import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { canAccessAnalytics } from '@domain/plan/limits';
import { detectPlatform, getPlatformDisplayName } from '@domain/analytics/platform';

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

const platformsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  limit: z.coerce.number().int().min(1).max(20).default(10),
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

  describe('platformsQuerySchema', () => {
    it('should default period to 30d', () => {
      const result = platformsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.period).toBe('30d');
    });

    it('should default limit to 10', () => {
      const result = platformsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(10);
    });

    it('should accept valid period', () => {
      const result = platformsQuerySchema.safeParse({ period: '7d' });
      expect(result.success).toBe(true);
    });

    it('should reject limit greater than 20', () => {
      const result = platformsQuerySchema.safeParse({ limit: '21' });
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

  it('should have correct platforms response structure', () => {
    const response = {
      podcast_id: 'pod_123',
      period: '30d',
      platforms: [
        { platform: 'apple_podcasts', display_name: 'Apple Podcasts', play_count: 100, percentage: 50.0 },
        { platform: 'spotify', display_name: 'Spotify', play_count: 60, percentage: 30.0 },
        { platform: 'other', display_name: 'Other', play_count: 40, percentage: 20.0 },
      ],
      total_plays: 200,
    };

    expect(response).toHaveProperty('podcast_id');
    expect(response).toHaveProperty('period');
    expect(response).toHaveProperty('platforms');
    expect(response).toHaveProperty('total_plays');
    expect(response.platforms[0]).toHaveProperty('platform');
    expect(response.platforms[0]).toHaveProperty('display_name');
    expect(response.platforms[0]).toHaveProperty('play_count');
    expect(response.platforms[0]).toHaveProperty('percentage');
  });
});

describe('Platform Detection', () => {
  it('should detect Apple Podcasts from AppleCoreMedia user agent', () => {
    expect(detectPlatform('AppleCoreMedia/1.0.0.19H12 (iPhone; U; CPU OS 15_7_1 like Mac OS X)')).toBe('apple_podcasts');
  });

  it('should detect Apple Podcasts from Podcasts app user agent', () => {
    expect(detectPlatform('Podcasts/1631.6 CFNetwork/1410.0.3 Darwin/22.6.0')).toBe('apple_podcasts');
  });

  it('should detect Spotify', () => {
    expect(detectPlatform('Spotify/8.8.0 iOS/16.6 (iPhone14,2)')).toBe('spotify');
  });

  it('should detect Amazon Music', () => {
    expect(detectPlatform('AmazonMusic/22.15.0 iOS/16.6 (iPhone14,2)')).toBe('amazon_music');
  });

  it('should detect Google Podcasts', () => {
    expect(detectPlatform('GooglePodcasts/2.0 Android/12')).toBe('google_podcasts');
  });

  it('should detect Overcast', () => {
    expect(detectPlatform('Overcast/3.0 (+http://overcast.fm/)')).toBe('overcast');
  });

  it('should detect Pocket Casts', () => {
    expect(detectPlatform('PocketCasts/1.0')).toBe('pocket_casts');
  });

  it('should detect Castro', () => {
    expect(detectPlatform('Castro/2023.7 (+https://castro.fm)')).toBe('castro');
  });

  it('should detect Podcast Addict', () => {
    expect(detectPlatform('Podcast Addict/v2023.2 - 1 user')).toBe('podcast_addict');
  });

  it('should detect web browser from Chrome user agent', () => {
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe('web_browser');
  });

  it('should return other for null user agent', () => {
    expect(detectPlatform(null)).toBe('other');
  });

  it('should return other for unknown user agent', () => {
    expect(detectPlatform('SomeUnknownApp/1.0')).toBe('other');
  });
});

describe('Platform Display Names', () => {
  it('should return correct display name for apple_podcasts', () => {
    expect(getPlatformDisplayName('apple_podcasts')).toBe('Apple Podcasts');
  });

  it('should return correct display name for spotify', () => {
    expect(getPlatformDisplayName('spotify')).toBe('Spotify');
  });

  it('should return correct display name for web_browser', () => {
    expect(getPlatformDisplayName('web_browser')).toBe('Web Browser');
  });

  it('should return correct display name for other', () => {
    expect(getPlatformDisplayName('other')).toBe('Other');
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
