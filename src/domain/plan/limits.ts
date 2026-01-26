// Plan limits definition
// Free plan restrictions for MVP

export type Plan = 'free' | 'starter' | 'pro';

export interface PlanLimits {
  maxPodcasts: number;
  maxEpisodesPerPodcast: number;
  maxEpisodeDurationSeconds: number;
  maxMonthlyPlays: number;
}

const FREE_PLAN_LIMITS: PlanLimits = {
  maxPodcasts: 2,
  maxEpisodesPerPodcast: 10,
  maxEpisodeDurationSeconds: 1800, // 30 minutes
  maxMonthlyPlays: 10000,
};

const STARTER_PLAN_LIMITS: PlanLimits = {
  maxPodcasts: 5,
  maxEpisodesPerPodcast: 50,
  maxEpisodeDurationSeconds: 7200, // 2 hours
  maxMonthlyPlays: 100000,
};

const PRO_PLAN_LIMITS: PlanLimits = {
  maxPodcasts: Infinity,
  maxEpisodesPerPodcast: Infinity,
  maxEpisodeDurationSeconds: Infinity,
  maxMonthlyPlays: Infinity,
};

export function getPlanLimits(plan: Plan): PlanLimits {
  switch (plan) {
    case 'free':
      return FREE_PLAN_LIMITS;
    case 'starter':
      return STARTER_PLAN_LIMITS;
    case 'pro':
      return PRO_PLAN_LIMITS;
    default:
      return FREE_PLAN_LIMITS;
  }
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}

export function checkPodcastLimit(currentCount: number, plan: Plan): LimitCheckResult {
  const limits = getPlanLimits(plan);
  if (currentCount >= limits.maxPodcasts) {
    return {
      allowed: false,
      reason: `Free plan allows up to ${limits.maxPodcasts} podcasts`,
      current: currentCount,
      limit: limits.maxPodcasts,
    };
  }
  return { allowed: true };
}

export function checkEpisodeLimit(currentCount: number, plan: Plan): LimitCheckResult {
  const limits = getPlanLimits(plan);
  if (currentCount >= limits.maxEpisodesPerPodcast) {
    return {
      allowed: false,
      reason: `Free plan allows up to ${limits.maxEpisodesPerPodcast} episodes per podcast`,
      current: currentCount,
      limit: limits.maxEpisodesPerPodcast,
    };
  }
  return { allowed: true };
}

export function checkEpisodeDuration(durationSeconds: number, plan: Plan): LimitCheckResult {
  const limits = getPlanLimits(plan);
  if (durationSeconds > limits.maxEpisodeDurationSeconds) {
    const maxMinutes = limits.maxEpisodeDurationSeconds / 60;
    return {
      allowed: false,
      reason: `Free plan allows episodes up to ${maxMinutes} minutes`,
      current: durationSeconds,
      limit: limits.maxEpisodeDurationSeconds,
    };
  }
  return { allowed: true };
}

export function checkMonthlyPlayLimit(currentPlays: number, plan: Plan): LimitCheckResult {
  const limits = getPlanLimits(plan);
  if (currentPlays >= limits.maxMonthlyPlays) {
    return {
      allowed: false,
      reason: `Monthly play limit of ${limits.maxMonthlyPlays.toLocaleString()} reached`,
      current: currentPlays,
      limit: limits.maxMonthlyPlays,
    };
  }
  return { allowed: true };
}

export function canAccessAnalytics(plan: Plan): boolean {
  // TODO: MVP後にStarter以上に制限する
  // return plan === 'starter' || plan === 'pro';
  return true;
}
