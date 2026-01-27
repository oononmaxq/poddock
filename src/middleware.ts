import { defineMiddleware } from 'astro:middleware';

/**
 * Astro middleware for Basic authentication on staging
 * Only activates when BASIC_AUTH_USER and BASIC_AUTH_PASS are set
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Get environment variables from Cloudflare runtime
  const runtime = context.locals.runtime;
  if (!runtime?.env) {
    return next();
  }

  const user = runtime.env.BASIC_AUTH_USER;
  const pass = runtime.env.BASIC_AUTH_PASS;

  // Skip if Basic auth is not configured
  if (!user || !pass) {
    return next();
  }

  const authHeader = context.request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorizedResponse();
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = atob(base64Credentials);
    const [inputUser, inputPass] = credentials.split(':');

    if (inputUser === user && inputPass === pass) {
      return next();
    }
  } catch {
    // Invalid base64
  }

  return unauthorizedResponse();
});

function unauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Staging Environment"',
    },
  });
}
