import type { DrizzleDB } from '@infrastructure/db/client';

export interface CloudflareBindings {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  R2_PUBLIC_URL: string;
  BASE_URL: string;
}

export interface AppVariables {
  db: DrizzleDB;
  userId: string | null;
}

export interface AppEnv {
  Bindings: CloudflareBindings;
  Variables: AppVariables;
}
