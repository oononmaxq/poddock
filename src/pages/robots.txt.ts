import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime.env;
  const baseUrl = (env.BASE_URL || 'https://poddock.io').replace(/\/$/, '');

  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /audio/
Disallow: /image/
Disallow: /login
Disallow: /mypage
Disallow: /analytics
Disallow: /settings
Disallow: /help/distribution
Disallow: /podcasts/new
Disallow: /podcasts/*/edit
Disallow: /podcasts/*/episodes/new

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
