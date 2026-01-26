import { describe, it, expect } from 'vitest';
import {
  getPlanLimits,
  checkPodcastLimit,
  checkEpisodeLimit,
  checkEpisodeDuration,
  checkMonthlyPlayLimit,
  canAccessAnalytics,
} from './limits';

describe('Plan Limits', () => {
  describe('getPlanLimits', () => {
    it('should return free plan limits', () => {
      const limits = getPlanLimits('free');
      expect(limits.maxPodcasts).toBe(2);
      expect(limits.maxEpisodesPerPodcast).toBe(10);
      expect(limits.maxEpisodeDurationSeconds).toBe(1800);
      expect(limits.maxMonthlyPlays).toBe(10000);
    });

    it('should return starter plan limits', () => {
      const limits = getPlanLimits('starter');
      expect(limits.maxPodcasts).toBe(5);
      expect(limits.maxEpisodesPerPodcast).toBe(50);
      expect(limits.maxEpisodeDurationSeconds).toBe(7200);
      expect(limits.maxMonthlyPlays).toBe(100000);
    });

    it('should return pro plan limits (unlimited)', () => {
      const limits = getPlanLimits('pro');
      expect(limits.maxPodcasts).toBe(Infinity);
      expect(limits.maxEpisodesPerPodcast).toBe(Infinity);
      expect(limits.maxEpisodeDurationSeconds).toBe(Infinity);
      expect(limits.maxMonthlyPlays).toBe(Infinity);
    });
  });

  describe('checkPodcastLimit', () => {
    it('should allow creating podcast when under limit', () => {
      const result = checkPodcastLimit(1, 'free');
      expect(result.allowed).toBe(true);
    });

    it('should deny creating podcast when at limit', () => {
      const result = checkPodcastLimit(2, 'free');
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(2);
      expect(result.limit).toBe(2);
    });

    it('should allow creating podcast for pro plan', () => {
      const result = checkPodcastLimit(100, 'pro');
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkEpisodeLimit', () => {
    it('should allow creating episode when under limit', () => {
      const result = checkEpisodeLimit(5, 'free');
      expect(result.allowed).toBe(true);
    });

    it('should deny creating episode when at limit', () => {
      const result = checkEpisodeLimit(10, 'free');
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(10);
      expect(result.limit).toBe(10);
    });

    it('should allow more episodes for starter plan', () => {
      const result = checkEpisodeLimit(25, 'starter');
      expect(result.allowed).toBe(true);
    });

    it('should allow unlimited episodes for pro plan', () => {
      const result = checkEpisodeLimit(1000, 'pro');
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkEpisodeDuration', () => {
    it('should allow episode under 30 minutes for free plan', () => {
      const result = checkEpisodeDuration(1500, 'free');
      expect(result.allowed).toBe(true);
    });

    it('should deny episode over 30 minutes for free plan', () => {
      const result = checkEpisodeDuration(2000, 'free');
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(2000);
      expect(result.limit).toBe(1800);
    });

    it('should allow exactly 30 minutes for free plan', () => {
      const result = checkEpisodeDuration(1800, 'free');
      expect(result.allowed).toBe(true);
    });

    it('should allow 2 hours for starter plan', () => {
      const result = checkEpisodeDuration(7200, 'starter');
      expect(result.allowed).toBe(true);
    });

    it('should deny over 2 hours for starter plan', () => {
      const result = checkEpisodeDuration(7500, 'starter');
      expect(result.allowed).toBe(false);
    });

    it('should allow any duration for pro plan', () => {
      const result = checkEpisodeDuration(36000, 'pro');
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkMonthlyPlayLimit', () => {
    it('should allow plays under limit', () => {
      const result = checkMonthlyPlayLimit(5000, 'free');
      expect(result.allowed).toBe(true);
    });

    it('should deny plays at limit', () => {
      const result = checkMonthlyPlayLimit(10000, 'free');
      expect(result.allowed).toBe(false);
    });

    it('should allow higher limit for starter', () => {
      const result = checkMonthlyPlayLimit(50000, 'starter');
      expect(result.allowed).toBe(true);
    });

    it('should allow unlimited plays for pro', () => {
      const result = checkMonthlyPlayLimit(1000000, 'pro');
      expect(result.allowed).toBe(true);
    });
  });

  describe('canAccessAnalytics', () => {
    it('should return false for free plan', () => {
      expect(canAccessAnalytics('free')).toBe(false);
    });

    it('should return true for starter plan', () => {
      expect(canAccessAnalytics('starter')).toBe(true);
    });

    it('should return true for pro plan', () => {
      expect(canAccessAnalytics('pro')).toBe(true);
    });
  });
});
