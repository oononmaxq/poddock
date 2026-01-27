/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<{
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  R2_PUBLIC_URL: string;
  BASE_URL: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  BASIC_AUTH_USER?: string;
  BASIC_AUTH_PASS?: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
