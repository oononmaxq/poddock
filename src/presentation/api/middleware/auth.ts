import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types';
import { AppError } from './error-handler';
import { verifyToken } from '@infrastructure/auth/jwt';

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'unauthorized', 'Authorization header required');
  }

  const token = authHeader.slice(7);
  const jwtSecret = c.env.JWT_SECRET;

  try {
    const payload = await verifyToken(token, jwtSecret);
    c.set('userId', payload.sub);
  } catch {
    throw new AppError(401, 'unauthorized', 'Invalid or expired token');
  }

  await next();
});
