import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type DrizzleDB = DrizzleD1Database<typeof schema>;

export function createDb(d1: D1Database): DrizzleDB {
  return drizzle(d1, { schema });
}
