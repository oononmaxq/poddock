import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { AppError } from '../middleware/error-handler';
import { createDb } from '@infrastructure/db/client';
import { adminUsers } from '@infrastructure/db/schema';
import { verifyPassword } from '@infrastructure/auth/password';
import { createToken } from '@infrastructure/auth/jwt';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = loginSchema.parse(body);

  const db = createDb(c.env.DB);
  const user = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email),
  });

  if (!user) {
    throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError(401, 'invalid_credentials', 'Invalid email or password');
  }

  const token = await createToken(user.id, user.email, c.env.JWT_SECRET);

  return c.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 3600,
  });
});

authRoutes.post('/logout', async (c) => {
  // JWT is stateless, client should discard the token
  return c.json({ message: 'Logged out successfully' });
});
