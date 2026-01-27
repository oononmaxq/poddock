import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

/**
 * Basic authentication middleware for staging environment
 * Only activates when BASIC_AUTH_USER and BASIC_AUTH_PASS are set
 */
export const basicAuthMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.env.BASIC_AUTH_USER;
  const pass = c.env.BASIC_AUTH_PASS;

  // Skip if Basic auth is not configured
  if (!user || !pass) {
    return next();
  }

  const authHeader = c.req.header('Authorization');

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
};

function unauthorizedResponse() {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Staging Environment"',
    },
  });
}
