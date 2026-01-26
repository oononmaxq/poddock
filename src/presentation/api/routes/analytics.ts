import { Hono } from 'hono';
import { z } from 'zod';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import { podcasts, episodes, playLogs, monthlyPlayStats } from '@infrastructure/db/schema';
import { canAccessAnalytics } from '@domain/plan/limits';
import type {
  AnalyticsOverview,
  EpisodeAnalytics,
  CountryAnalytics,
  DailyAnalytics,
  AnalyticsPeriodOption,
} from '@domain/analytics/types';

export const analyticsRoutes = new Hono<AppEnv>();

// Plan check middleware for all analytics routes
analyticsRoutes.use('*', async (c, next) => {
  const userPlan = c.get('userPlan');
  if (!canAccessAnalytics(userPlan)) {
    throw new AppError(403, 'plan_required', 'Analytics requires Starter plan or higher');
  }
  await next();
});

// Helper: Get date string N days ago
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Helper: Get year-month string N months ago
function getYearMonthMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Helper: Get current year-month
function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Helper: Get today's date
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper: Convert period option to start date
function getPeriodStartDate(period: AnalyticsPeriodOption): string | null {
  switch (period) {
    case '7d':
      return getDateDaysAgo(7);
    case '30d':
      return getDateDaysAgo(30);
    case '90d':
      return getDateDaysAgo(90);
    case 'all':
      return null;
  }
}

// Query param schemas
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

// GET /overview - Monthly play counts overview
analyticsRoutes.get('/overview', async (c) => {
  const podcastId = c.req.param('podcastId');
  const query = overviewQuerySchema.parse(c.req.query());
  const db = createDb(c.env.DB);

  // Check podcast exists
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });
  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  const startMonth = getYearMonthMonthsAgo(query.months - 1);
  const endMonth = getCurrentYearMonth();

  // Get monthly stats
  const stats = await db
    .select({
      yearMonth: monthlyPlayStats.yearMonth,
      playCount: monthlyPlayStats.playCount,
    })
    .from(monthlyPlayStats)
    .where(
      and(
        eq(monthlyPlayStats.podcastId, podcastId),
        gte(monthlyPlayStats.yearMonth, startMonth),
        lte(monthlyPlayStats.yearMonth, endMonth)
      )
    )
    .orderBy(monthlyPlayStats.yearMonth);

  // Calculate totals
  const totalPlays = stats.reduce((sum, s) => sum + s.playCount, 0);
  const currentMonthPlays =
    stats.find((s) => s.yearMonth === endMonth)?.playCount ?? 0;

  // Fill in missing months with zero
  const monthlyPlays: Array<{ year_month: string; play_count: number }> = [];
  const current = new Date();
  for (let i = query.months - 1; i >= 0; i--) {
    const d = new Date(current);
    d.setMonth(d.getMonth() - i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const found = stats.find((s) => s.yearMonth === ym);
    monthlyPlays.push({
      year_month: ym,
      play_count: found?.playCount ?? 0,
    });
  }

  const response: AnalyticsOverview = {
    podcastId,
    period: {
      start: `${startMonth}-01`,
      end: `${endMonth}-${new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()}`,
    },
    monthlyPlays: monthlyPlays.map((m) => ({
      yearMonth: m.year_month,
      playCount: m.play_count,
    })),
    totalPlays,
    currentMonthPlays,
  };

  return c.json({
    podcast_id: response.podcastId,
    period: response.period,
    monthly_plays: monthlyPlays,
    total_plays: response.totalPlays,
    current_month_plays: response.currentMonthPlays,
  });
});

// GET /episodes - Episode-level play counts
analyticsRoutes.get('/episodes', async (c) => {
  const podcastId = c.req.param('podcastId');
  const query = episodesQuerySchema.parse(c.req.query());
  const db = createDb(c.env.DB);

  // Check podcast exists
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });
  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  const startDate = getPeriodStartDate(query.period);

  // Build query conditions
  const conditions = [eq(playLogs.podcastId, podcastId)];
  if (startDate) {
    conditions.push(gte(playLogs.playedAt, startDate));
  }

  // Get episode play counts
  const episodeStats = await db
    .select({
      episodeId: playLogs.episodeId,
      playCount: sql<number>`count(*)`.as('play_count'),
    })
    .from(playLogs)
    .where(and(...conditions))
    .groupBy(playLogs.episodeId)
    .orderBy(desc(sql`count(*)`))
    .limit(query.limit);

  // Get total plays for percentage calculation
  const [totalResult] = await db
    .select({
      total: sql<number>`count(*)`.as('total'),
    })
    .from(playLogs)
    .where(and(...conditions));
  const totalPlays = Number(totalResult?.total ?? 0);

  // Get episode titles
  const episodeIds = episodeStats.map((e) => e.episodeId);
  const episodeDetails =
    episodeIds.length > 0
      ? await db.select().from(episodes).where(sql`${episodes.id} IN ${episodeIds}`)
      : [];

  const episodeMap = new Map(episodeDetails.map((e) => [e.id, e]));

  const episodesList = episodeStats.map((e) => {
    const episode = episodeMap.get(e.episodeId);
    const playCount = Number(e.playCount);
    return {
      episode_id: e.episodeId,
      title: episode?.title ?? 'Unknown Episode',
      play_count: playCount,
      percentage: totalPlays > 0 ? Math.round((playCount / totalPlays) * 1000) / 10 : 0,
    };
  });

  return c.json({
    podcast_id: podcastId,
    period: query.period,
    episodes: episodesList,
    total_plays: totalPlays,
  });
});

// GET /countries - Country distribution
analyticsRoutes.get('/countries', async (c) => {
  const podcastId = c.req.param('podcastId');
  const query = countriesQuerySchema.parse(c.req.query());
  const db = createDb(c.env.DB);

  // Check podcast exists
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });
  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  const startDate = getPeriodStartDate(query.period);

  // Build query conditions
  const conditions = [eq(playLogs.podcastId, podcastId)];
  if (startDate) {
    conditions.push(gte(playLogs.playedAt, startDate));
  }

  // Get country play counts
  const countryStats = await db
    .select({
      country: playLogs.country,
      playCount: sql<number>`count(*)`.as('play_count'),
    })
    .from(playLogs)
    .where(and(...conditions))
    .groupBy(playLogs.country)
    .orderBy(desc(sql`count(*)`));

  // Get total plays
  const totalPlays = countryStats.reduce((sum, c) => sum + Number(c.playCount), 0);

  // Aggregate small countries into "OTHER"
  const topCountries = countryStats.slice(0, query.limit);
  const otherCountries = countryStats.slice(query.limit);
  const otherTotal = otherCountries.reduce((sum, c) => sum + Number(c.playCount), 0);

  const countriesList = topCountries.map((c) => {
    const playCount = Number(c.playCount);
    return {
      country: c.country ?? 'UNKNOWN',
      play_count: playCount,
      percentage: totalPlays > 0 ? Math.round((playCount / totalPlays) * 1000) / 10 : 0,
    };
  });

  if (otherTotal > 0) {
    countriesList.push({
      country: 'OTHER',
      play_count: otherTotal,
      percentage: totalPlays > 0 ? Math.round((otherTotal / totalPlays) * 1000) / 10 : 0,
    });
  }

  return c.json({
    podcast_id: podcastId,
    period: query.period,
    countries: countriesList,
    total_plays: totalPlays,
  });
});

// GET /daily - Daily time series
analyticsRoutes.get('/daily', async (c) => {
  const podcastId = c.req.param('podcastId');
  const query = dailyQuerySchema.parse(c.req.query());
  const db = createDb(c.env.DB);

  // Check podcast exists
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });
  if (!podcast) {
    throw new AppError(404, 'not_found', 'Podcast not found');
  }

  const startDate = getDateDaysAgo(query.days - 1);
  const endDate = getToday();

  // Get daily play counts
  const dailyStats = await db
    .select({
      date: sql<string>`date(${playLogs.playedAt})`.as('date'),
      playCount: sql<number>`count(*)`.as('play_count'),
    })
    .from(playLogs)
    .where(
      and(
        eq(playLogs.podcastId, podcastId),
        gte(playLogs.playedAt, startDate)
      )
    )
    .groupBy(sql`date(${playLogs.playedAt})`)
    .orderBy(sql`date(${playLogs.playedAt})`);

  // Create a map for quick lookup
  const statsMap = new Map(dailyStats.map((d) => [d.date, Number(d.playCount)]));

  // Fill in missing days with zero
  const dailyPlays: Array<{ date: string; play_count: number }> = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    dailyPlays.push({
      date: dateStr,
      play_count: statsMap.get(dateStr) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return c.json({
    podcast_id: podcastId,
    period: {
      start: startDate,
      end: endDate,
    },
    daily_plays: dailyPlays,
  });
});
