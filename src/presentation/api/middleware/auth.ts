import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from './error-handler';
import { verifyToken } from '@infrastructure/auth/jwt';
import { createDb } from '@infrastructure/db/client';
import { adminUsers } from '@infrastructure/db/schema';

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

    // Fetch user plan
    const db = createDb(c.env.DB);
    const user = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, payload.sub),
    });

    c.set('userPlan', user?.plan ?? 'free');
  } catch {
    throw new AppError(401, 'unauthorized', 'Invalid or expired token');
  }

  await next();
});
