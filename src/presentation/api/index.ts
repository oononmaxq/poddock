import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { podcastRoutes } from './routes/podcasts';
import { assetRoutes } from './routes/assets';
import { rssRoutes } from './routes/rss';
import { publicRoutes } from './routes/public';
import { handleError } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import type { AppEnv } from './types';

const api = new Hono<AppEnv>();

// Global error handler
api.onError(handleError);

// Global middleware
api.use('*', cors());

// Public routes (no auth required)
api.route('/auth', authRoutes);
api.route('/rss', rssRoutes);
api.route('/public', publicRoutes);

// Protected routes (auth required)
api.use('/podcasts', authMiddleware);
api.use('/podcasts/*', authMiddleware);
api.use('/assets/*', authMiddleware);
api.route('/podcasts', podcastRoutes);
api.route('/assets', assetRoutes);

export { api };
