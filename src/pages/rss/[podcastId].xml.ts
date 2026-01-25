import type { APIRoute } from 'astro';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { createDb } from '@infrastructure/db/client';
import { podcasts, episodes, assets, feedTokens } from '@infrastructure/db/schema';
import { formatRFC2822 } from '@infrastructure/utils/date';

export const GET: APIRoute = async ({ params, request, locals }) => {
  const podcastId = params.podcastId!;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const env = locals.runtime.env;
  const db = createDb(env.DB);

  // Get podcast
  const [podcast] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.id, podcastId))
    .limit(1);

  if (!podcast) {
    console.log('RSS: Podcast not found:', podcastId);
    return new Response('Podcast not found', { status: 404 });
  }

  console.log('RSS: Found podcast:', podcast.title, 'visibility:', podcast.visibility);

  // Access control for private podcasts
  if (podcast.visibility === 'private') {
    if (!token) {
      console.log('RSS: No token provided for private podcast');
      return new Response('Token required', { status: 404 });
    }

    // Debug: List all tokens for this podcast
    const allTokens = await db
      .select()
      .from(feedTokens)
      .where(eq(feedTokens.podcastId, podcastId));
    console.log('RSS: Tokens for podcast:', allTokens);
    console.log('RSS: Provided token:', token);

    const [feedToken] = await db
      .select()
      .from(feedTokens)
      .where(
        and(
          eq(feedTokens.podcastId, podcastId),
          eq(feedTokens.token, token),
          isNull(feedTokens.revokedAt)
        )
      )
      .limit(1);

    if (!feedToken) {
      console.log('RSS: Token not found or revoked');
      return new Response('Invalid token', { status: 404 });
    }
  }

  // Get published episodes with audio
  const publishedEpisodes = await db
    .select({
      episode: episodes,
      audio: assets,
    })
    .from(episodes)
    .leftJoin(assets, eq(episodes.audioAssetId, assets.id))
    .where(
      and(
        eq(episodes.podcastId, podcastId),
        eq(episodes.status, 'published')
      )
    )
    .orderBy(desc(episodes.publishedAt));

  // Get cover image
  let coverImageUrl: string | null = null;
  if (podcast.coverImageAssetId) {
    const [coverAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, podcast.coverImageAssetId))
      .limit(1);
    if (coverAsset) {
      coverImageUrl = coverAsset.publicUrl;
    }
  }

  // Calculate dates
  const dates = [new Date(podcast.updatedAt)];
  for (const ep of publishedEpisodes) {
    dates.push(new Date(ep.episode.updatedAt));
  }
  const lastBuildDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const firstEpisode = publishedEpisodes[publishedEpisodes.length - 1];
  const pubDate = firstEpisode?.episode.publishedAt
    ? new Date(firstEpisode.episode.publishedAt)
    : new Date(podcast.createdAt);

  const baseUrl = env.BASE_URL || 'http://localhost:4321';
  const channelLink = `${baseUrl}/podcasts/${podcast.id}/public`;

  // Generate RSS XML
  const xml = generateRssXml({
    podcast,
    episodes: publishedEpisodes,
    coverImageUrl,
    channelLink,
    lastBuildDate,
    pubDate,
  });

  const etag = `"${lastBuildDate.getTime().toString(36)}"`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'ETag': etag,
      'Last-Modified': lastBuildDate.toUTCString(),
      'Cache-Control': 'public, max-age=300',
    },
  });
};

interface RssParams {
  podcast: {
    id: string;
    title: string;
    description: string;
    language: string;
    category: string;
    authorName: string | null;
    contactEmail: string | null;
    explicit: boolean;
    podcastType: 'episodic' | 'serial';
  };
  episodes: Array<{
    episode: {
      id: string;
      title: string;
      description: string | null;
      publishedAt: string | null;
      durationSeconds: number | null;
    };
    audio: {
      publicUrl: string;
      byteSize: number;
      contentType: string;
    } | null;
  }>;
  coverImageUrl: string | null;
  channelLink: string;
  lastBuildDate: Date;
  pubDate: Date;
}

function generateRssXml(params: RssParams): string {
  const { podcast, episodes, coverImageUrl, channelLink, lastBuildDate, pubDate } = params;
  const authorName = podcast.authorName || podcast.title;
  const ownerEmail = podcast.contactEmail || 'noreply@example.com';

  const items = episodes
    .filter((ep) => ep.audio)
    .map((ep) => {
      const description = ep.episode.description || '';
      const duration = ep.episode.durationSeconds ? formatDuration(ep.episode.durationSeconds) : null;

      return `
    <item>
      <title>${escapeXml(ep.episode.title)}</title>
      <description>${escapeXml(description)}</description>
      <pubDate>${formatRFC2822(new Date(ep.episode.publishedAt!))}</pubDate>
      <guid isPermaLink="false">poddock:episode:${ep.episode.id}</guid>
      <enclosure url="${escapeXml(ep.audio!.publicUrl)}" length="${ep.audio!.byteSize}" type="${ep.audio!.contentType}" />
      <itunes:explicit>${podcast.explicit ? 'true' : 'false'}</itunes:explicit>${duration ? `
      <itunes:duration>${duration}</itunes:duration>` : ''}
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(podcast.title)}</title>
    <description>${escapeXml(podcast.description)}</description>
    <language>${podcast.language}</language>
    <link>${escapeXml(channelLink)}</link>
    <lastBuildDate>${formatRFC2822(lastBuildDate)}</lastBuildDate>
    <pubDate>${formatRFC2822(pubDate)}</pubDate>
    <itunes:type>${podcast.podcastType}</itunes:type>
    <itunes:author>${escapeXml(authorName)}</itunes:author>
    <itunes:summary>${escapeXml(podcast.description)}</itunes:summary>
    <itunes:explicit>${podcast.explicit ? 'true' : 'false'}</itunes:explicit>
    <itunes:category text="${escapeXml(podcast.category)}" />
    <itunes:owner>
      <itunes:name>${escapeXml(authorName)}</itunes:name>
      <itunes:email>${escapeXml(ownerEmail)}</itunes:email>
    </itunes:owner>${coverImageUrl ? `
    <itunes:image href="${escapeXml(coverImageUrl)}" />
    <image>
      <url>${escapeXml(coverImageUrl)}</url>
      <title>${escapeXml(podcast.title)}</title>
      <link>${escapeXml(channelLink)}</link>
    </image>` : ''}${items}
  </channel>
</rss>`;
}

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
