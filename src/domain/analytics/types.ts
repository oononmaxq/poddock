// Analytics domain types

export interface MonthlyPlayData {
  yearMonth: string; // "YYYY-MM"
  playCount: number;
}

export interface EpisodePlayData {
  episodeId: string;
  title: string;
  playCount: number;
  percentage: number;
}

export interface CountryPlayData {
  country: string; // ISO 3166-1 alpha-2 or "OTHER"
  playCount: number;
  percentage: number;
}

export interface DailyPlayData {
  date: string; // "YYYY-MM-DD"
  playCount: number;
}

export interface PlatformPlayData {
  platform: string;
  displayName: string;
  playCount: number;
  percentage: number;
}

export interface AnalyticsPeriod {
  start: string;
  end: string;
}

export type AnalyticsPeriodOption = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsOverview {
  podcastId: string;
  period: AnalyticsPeriod;
  monthlyPlays: MonthlyPlayData[];
  totalPlays: number;
  currentMonthPlays: number;
}

export interface EpisodeAnalytics {
  podcastId: string;
  period: AnalyticsPeriodOption;
  episodes: EpisodePlayData[];
  totalPlays: number;
}

export interface CountryAnalytics {
  podcastId: string;
  period: AnalyticsPeriodOption;
  countries: CountryPlayData[];
  totalPlays: number;
}

export interface DailyAnalytics {
  podcastId: string;
  period: AnalyticsPeriod;
  dailyPlays: DailyPlayData[];
}

export interface PlatformAnalytics {
  podcastId: string;
  period: AnalyticsPeriodOption;
  platforms: PlatformPlayData[];
  totalPlays: number;
}
