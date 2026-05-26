import { Hono } from 'hono';
import { authRoutes } from './routes/auth';
import { rssRoutes } from './routes/rss';
import { publicRoutes } from './routes/public';
import { playRoutes } from './routes/play';
import { listeningHistoryRoutes } from './routes/listening-history';
import { channelSubscriptionRoutes } from './routes/channel-subscriptions';
import { episodeFavoriteRoutes } from './routes/episode-favorites';
import { handleError } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import type { AppEnv } from './types';

const api = new Hono<AppEnv>();

function getAllowedOrigins(baseUrl: string): Set<string> {
  const origins = new Set<string>([
    'http://localhost:4321',
    'http://127.0.0.1:4321',
  ]);

  try {
    origins.add(new URL(baseUrl).origin);
  } catch {
    // Ignore invalid BASE_URL and keep development defaults
  }

  return origins;
}

// Global error handler
api.onError(handleError);

// Strict CORS policy for API routes
api.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const allowedOrigins = getAllowedOrigins(c.env.BASE_URL);
  const isAllowedOrigin = Boolean(origin && allowedOrigins.has(origin));

  if (c.req.method === 'OPTIONS') {
    if (!isAllowedOrigin || !origin) {
      return c.body(null, 403);
    }
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Max-Age', '86400');
    return c.body(null, 204);
  }

  await next();

  if (isAllowedOrigin && origin) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Credentials', 'true');
  }
});

// Public routes (no auth required)
api.route('/auth', authRoutes);
api.route('/rss', rssRoutes);
api.route('/public', publicRoutes);
api.route('/play', playRoutes);

// Protected routes (auth required)
api.use('/listening-history', authMiddleware);
api.use('/listening-history/*', authMiddleware);
api.use('/channel-subscriptions', authMiddleware);
api.use('/channel-subscriptions/*', authMiddleware);
api.use('/episode-favorites', authMiddleware);
api.use('/episode-favorites/*', authMiddleware);
api.route('/listening-history', listeningHistoryRoutes);
api.route('/channel-subscriptions', channelSubscriptionRoutes);
api.route('/episode-favorites', episodeFavoriteRoutes);

export { api };
