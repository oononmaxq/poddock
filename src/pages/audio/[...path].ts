import type { APIRoute } from 'astro';

// Serve audio files from R2 bucket (for local development)
export const GET: APIRoute = async ({ params, locals }) => {
  const path = params.path;
  if (!path) {
    return new Response('Not found', { status: 404 });
  }

  const env = locals.runtime.env;
  const bucket = env.BUCKET;

  if (!bucket) {
    return new Response('R2 bucket not configured', { status: 500 });
  }

  const key = `audio/${path}`;
  const object = await bucket.get(key);

  if (!object) {
    return new Response('File not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'audio/mpeg');
  headers.set('Content-Length', object.size.toString());
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
};
