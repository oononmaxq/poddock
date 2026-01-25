import type { APIRoute } from 'astro';
import { api } from '@presentation/api';

export const ALL: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  // Extract path after /api
  const url = new URL(request.url);
  const apiPath = url.pathname.replace(/^\/api/, '') || '/';
  const newUrl = new URL(apiPath + url.search, url.origin);

  // Create a new request with the modified URL
  const apiRequest = new Request(newUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    // @ts-expect-error - duplex is required for streaming body
    duplex: 'half',
  });

  return api.fetch(apiRequest, env);
};
