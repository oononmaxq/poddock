import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { createDb } from '@infrastructure/db/client';
import { rssSourceSnapshots, rssSources } from '@infrastructure/db/schema';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: string;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime.env;
  const db = createDb(env.DB);
  const baseUrl = (env.BASE_URL || 'https://poddock.io').replace(/\/$/, '');

  const staticUrls: SitemapUrl[] = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/podcasts`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/terms`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${baseUrl}/legal`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: '0.3' },
  ];

  const feedRows = await db
    .select({
      id: rssSources.id,
      updatedAt: rssSourceSnapshots.updatedAt,
    })
    .from(rssSources)
    .leftJoin(rssSourceSnapshots, eq(rssSources.id, rssSourceSnapshots.sourceId))
    .where(eq(rssSources.isActive, true));

  const feedUrls: SitemapUrl[] = feedRows.map((row) => ({
    loc: `${baseUrl}/feeds/${row.id}`,
    lastmod: row.updatedAt ?? undefined,
    changefreq: 'daily',
    priority: '0.8',
  }));

  const urls = [...staticUrls, ...feedUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}${url.changefreq ? `
    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority ? `
    <priority>${url.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
