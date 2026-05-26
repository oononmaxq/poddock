import { defineMiddleware } from 'astro:middleware';

const PROD_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https:",
  "media-src 'self' https:",
].join('; ');

const DEV_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: http:",
  "font-src 'self' data: https: http:",
  "connect-src 'self' ws: wss: http: https:",
  "media-src 'self' http: https:",
].join('; ');

/**
 * Astro middleware for Basic authentication on staging
 * Only activates when BASIC_AUTH_USER and BASIC_AUTH_PASS are set
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Get environment variables from Cloudflare runtime
  const runtime = context.locals.runtime;
  if (!runtime?.env) {
    const response = await next();
    return withSecurityHeaders(response, context.request.url);
  }

  const user = runtime.env.BASIC_AUTH_USER;
  const pass = runtime.env.BASIC_AUTH_PASS;

  // Skip if Basic auth is not configured
  if (!user || !pass) {
    const response = await next();
    return withSecurityHeaders(response, context.request.url);
  }

  const authHeader = context.request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorizedResponse(context.request.url);
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = atob(base64Credentials);
    const [inputUser, inputPass] = credentials.split(':');

    if (inputUser === user && inputPass === pass) {
      const response = await next();
      return withSecurityHeaders(response, context.request.url);
    }
  } catch {
    // Invalid base64
  }

  return unauthorizedResponse(context.request.url);
});

function unauthorizedResponse(requestUrl: string): Response {
  const response = new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Staging Environment"',
    },
  });
  return withSecurityHeaders(response, requestUrl);
}

function withSecurityHeaders(response: Response, requestUrl: string): Response {
  const request = new URL(requestUrl);
  const isLocal = request.hostname === 'localhost' || request.hostname === '127.0.0.1';
  const headers = new Headers(response.headers);

  headers.set('Content-Security-Policy', isLocal ? DEV_CSP : PROD_CSP);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (!isLocal && request.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
