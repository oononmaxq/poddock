import { Hono } from "hono";
import { eq, and, desc, isNull } from "drizzle-orm";
import type { AppEnv } from "../types";
import { createDb } from "@infrastructure/db/client";
import {
  podcasts,
  episodes,
  assets,
  feedTokens,
} from "@infrastructure/db/schema";
import { formatRFC2822 } from "@infrastructure/utils/date";

export const rssRoutes = new Hono<AppEnv>();

// Public/Private RSS feed
rssRoutes.get("/:podcastId.xml", async (c) => {
  const podcastId = c.req.param("podcastId");
  const token = c.req.query("token");
  const db = createDb(c.env.DB);

  const [podcast] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.id, podcastId))
    .limit(1);

  if (!podcast) {
    return c.notFound();
  }

  // Access control
  if (podcast.visibility === "private") {
    if (!token) {
      return c.notFound();
    }

    // Verify token
    const [feedToken] = await db
      .select()
      .from(feedTokens)
      .where(
        and(
          eq(feedTokens.podcastId, podcastId),
          eq(feedTokens.token, token),
          isNull(feedTokens.revokedAt),
        ),
      )
      .limit(1);

    if (!feedToken) {
      return c.notFound();
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
      and(eq(episodes.podcastId, podcastId), eq(episodes.status, "published")),
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

  // Calculate lastBuildDate
  const dates = [new Date(podcast.updatedAt)];
  for (const ep of publishedEpisodes) {
    dates.push(new Date(ep.episode.updatedAt));
  }
  const lastBuildDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Calculate pubDate (first episode's published_at or podcast created_at)
  const firstEpisode = publishedEpisodes[publishedEpisodes.length - 1];
  const pubDate = firstEpisode?.episode.publishedAt
    ? new Date(firstEpisode.episode.publishedAt)
    : new Date(podcast.createdAt);

  const baseUrl = c.env.BASE_URL;
  const channelLink = `${baseUrl}/podcasts/${podcast.id}`;

  // Generate RSS XML
  const xml = generateRssXml({
    podcast,
    episodes: publishedEpisodes,
    coverImageUrl,
    channelLink,
    lastBuildDate,
    pubDate,
    baseUrl,
  });

  // Generate ETag from lastBuildDate
  const etag = `"${lastBuildDate.getTime().toString(36)}"`;
  const lastModified = lastBuildDate.toUTCString();

  // Check If-None-Match
  const ifNoneMatch = c.req.header("If-None-Match");
  if (ifNoneMatch === etag) {
    return c.body(null, 304);
  }

  // Check If-Modified-Since
  const ifModifiedSince = c.req.header("If-Modified-Since");
  if (ifModifiedSince) {
    const ifModifiedDate = new Date(ifModifiedSince);
    if (lastBuildDate <= ifModifiedDate) {
      return c.body(null, 304);
    }
  }

  return c.body(xml, 200, {
    "Content-Type": "application/rss+xml; charset=utf-8",
    ETag: etag,
    "Last-Modified": lastModified,
    "Cache-Control": "public, max-age=300",
  });
});

interface RssGenerateParams {
  podcast: {
    id: string;
    title: string;
    description: string;
    language: string;
    category: string;
    authorName: string | null;
    contactEmail: string | null;
    explicit: boolean;
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
  baseUrl: string;
}

function generateRssXml(params: RssGenerateParams): string {
  const {
    podcast,
    episodes,
    coverImageUrl,
    channelLink,
    lastBuildDate,
    pubDate,
    baseUrl,
  } = params;

  const authorName = podcast.authorName || "PODDOCK";

  const items = episodes
    .filter((ep) => ep.audio)
    .map((ep) => {
      const description =
        ep.episode.description || "Episode details on PODDOCK";
      const duration = ep.episode.durationSeconds
        ? formatDuration(ep.episode.durationSeconds)
        : null;

      // Use play redirect URL for tracking
      const playUrl = `${baseUrl}/play/${ep.episode.id}`;

      return `
    <item>
      <title>${escapeXml(ep.episode.title)}</title>
      <description>${escapeXml(description)}</description>
      <pubDate>${formatRFC2822(new Date(ep.episode.publishedAt!))}</pubDate>
      <guid isPermaLink="false">PODDOCK:episode:${ep.episode.id}</guid>
      <enclosure url="${escapeXml(playUrl)}" length="${ep.audio!.byteSize}" type="${ep.audio!.contentType}" />
      <itunes:explicit>${podcast.explicit ? "true" : "false"}</itunes:explicit>${
        duration
          ? `
      <itunes:duration>${duration}</itunes:duration>`
          : ""
      }
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(podcast.title)}</title>
    <description>${escapeXml(podcast.description)}</description>
    <language>${podcast.language}</language>
    <link>${escapeXml(channelLink)}</link>
    <lastBuildDate>${formatRFC2822(lastBuildDate)}</lastBuildDate>
    <pubDate>${formatRFC2822(pubDate)}</pubDate>
    <itunes:author>${escapeXml(authorName)}</itunes:author>
    <itunes:summary>${escapeXml(podcast.description)}</itunes:summary>
    <itunes:explicit>${podcast.explicit ? "true" : "false"}</itunes:explicit>
    <itunes:category text="${escapeXml(podcast.category)}" />${
      coverImageUrl
        ? `
    <itunes:image href="${escapeXml(coverImageUrl)}" />
    <image>
      <url>${escapeXml(coverImageUrl)}</url>
      <title>${escapeXml(podcast.title)}</title>
      <link>${escapeXml(channelLink)}</link>
    </image>`
        : ""
    }${
      podcast.contactEmail
        ? `
    <itunes:owner>
      <itunes:email>${escapeXml(podcast.contactEmail)}</itunes:email>
    </itunes:owner>`
        : ""
    }${items}
  </channel>
</rss>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
