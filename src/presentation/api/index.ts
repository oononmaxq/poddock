import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { podcastRoutes } from './routes/podcasts';
import { assetRoutes } from './routes/assets';
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

// Global error handler
api.onError(handleError);

// Global middleware
api.use('*', cors());

// Public routes (no auth required)
api.route('/auth', authRoutes);
api.route('/rss', rssRoutes);
api.route('/public', publicRoutes);
api.route('/play', playRoutes);

// Protected routes (auth required)
api.use('/podcasts', authMiddleware);
api.use('/podcasts/*', authMiddleware);
api.use('/assets/*', authMiddleware);
api.use('/listening-history', authMiddleware);
api.use('/listening-history/*', authMiddleware);
api.use('/channel-subscriptions', authMiddleware);
api.use('/channel-subscriptions/*', authMiddleware);
api.use('/episode-favorites', authMiddleware);
api.use('/episode-favorites/*', authMiddleware);
api.route('/podcasts', podcastRoutes);
api.route('/assets', assetRoutes);
api.route('/listening-history', listeningHistoryRoutes);
api.route('/channel-subscriptions', channelSubscriptionRoutes);
api.route('/episode-favorites', episodeFavoriteRoutes);

export { api };
