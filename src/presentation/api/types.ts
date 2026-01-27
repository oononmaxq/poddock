import type { DrizzleDB } from "@infrastructure/db/client";

export interface CloudflareBindings {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  R2_PUBLIC_URL: string;
  BASE_URL: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string; // e.g., "noreply@PODDOCK.app"
  // Basic auth for staging (optional)
  BASIC_AUTH_USER?: string;
  BASIC_AUTH_PASS?: string;
}

export interface AppVariables {
  db: DrizzleDB;
  userId: string | null;
  userPlan: "free" | "starter" | "pro";
}

export interface AppEnv {
  Bindings: CloudflareBindings;
  Variables: AppVariables;
}
