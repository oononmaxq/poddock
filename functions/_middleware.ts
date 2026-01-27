/**
 * Cloudflare Pages middleware for Basic authentication on staging
 * This runs before all requests (both API and pages)
 */

interface Env {
  BASIC_AUTH_USER?: string;
  BASIC_AUTH_PASS?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  // Skip if Basic auth is not configured
  if (!env.BASIC_AUTH_USER || !env.BASIC_AUTH_PASS) {
    return context.next();
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorizedResponse();
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = atob(base64Credentials);
    const [inputUser, inputPass] = credentials.split(':');

    if (inputUser === env.BASIC_AUTH_USER && inputPass === env.BASIC_AUTH_PASS) {
      return context.next();
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
