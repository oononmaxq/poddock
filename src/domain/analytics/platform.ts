// Platform detection from User-Agent strings

export type PodcastPlatform =
  | 'apple_podcasts'
  | 'spotify'
  | 'amazon_music'
  | 'google_podcasts'
  | 'overcast'
  | 'pocket_casts'
  | 'castro'
  | 'podbean'
  | 'stitcher'
  | 'castbox'
  | 'podcast_addict'
  | 'player_fm'
  | 'breaker'
  | 'radio_public'
  | 'web_browser'
  | 'other';

interface PlatformMatcher {
  platform: PodcastPlatform;
  patterns: RegExp[];
}

const PLATFORM_MATCHERS: PlatformMatcher[] = [
  {
    platform: 'apple_podcasts',
    patterns: [
      /AppleCoreMedia/i,
      /iTunes/i,
      /Podcasts\//i,
      /Apple Podcasts/i,
    ],
  },
  {
    platform: 'spotify',
    patterns: [/Spotify\//i, /SpotifyPodcasts/i],
  },
  {
    platform: 'amazon_music',
    patterns: [/AmazonMusic/i, /Amazon Music/i, /Alexa/i],
  },
  {
    platform: 'google_podcasts',
    patterns: [/GooglePodcasts/i, /Google Podcasts/i, /Google-Podcast/i],
  },
  {
    platform: 'overcast',
    patterns: [/Overcast\//i],
  },
  {
    platform: 'pocket_casts',
    patterns: [/PocketCasts/i, /Pocket Casts/i],
  },
  {
    platform: 'castro',
    patterns: [/Castro\//i, /Castro Podcasts/i],
  },
  {
    platform: 'podbean',
    patterns: [/Podbean/i],
  },
  {
    platform: 'stitcher',
    patterns: [/Stitcher/i],
  },
  {
    platform: 'castbox',
    patterns: [/CastBox/i, /Castbox/i],
  },
  {
    platform: 'podcast_addict',
    patterns: [/Podcast ?Addict/i, /PodcastAddict/i],
  },
  {
    platform: 'player_fm',
    patterns: [/Player FM/i, /PlayerFM/i],
  },
  {
    platform: 'breaker',
    patterns: [/Breaker\//i],
  },
  {
    platform: 'radio_public',
    patterns: [/RadioPublic/i],
  },
];

const WEB_BROWSER_PATTERNS = [
  /Mozilla/i,
  /Chrome/i,
  /Safari/i,
  /Firefox/i,
  /Edge/i,
  /Opera/i,
];

/**
 * Detect podcast platform from User-Agent string
 */
export function detectPlatform(userAgent: string | null): PodcastPlatform {
  if (!userAgent) {
    return 'other';
  }

  // Check for known podcast platforms first
  for (const matcher of PLATFORM_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(userAgent))) {
      return matcher.platform;
    }
  }

  // Check if it's a web browser
  if (WEB_BROWSER_PATTERNS.some((pattern) => pattern.test(userAgent))) {
    return 'web_browser';
  }

  return 'other';
}

/**
 * Get display name for a platform
 */
export function getPlatformDisplayName(platform: PodcastPlatform): string {
  const names: Record<PodcastPlatform, string> = {
    apple_podcasts: 'Apple Podcasts',
    spotify: 'Spotify',
    amazon_music: 'Amazon Music',
    google_podcasts: 'Google Podcasts',
    overcast: 'Overcast',
    pocket_casts: 'Pocket Casts',
    castro: 'Castro',
    podbean: 'Podbean',
    stitcher: 'Stitcher',
    castbox: 'Castbox',
    podcast_addict: 'Podcast Addict',
    player_fm: 'Player FM',
    breaker: 'Breaker',
    radio_public: 'RadioPublic',
    web_browser: 'Web Browser',
    other: 'Other',
  };
  return names[platform];
}
