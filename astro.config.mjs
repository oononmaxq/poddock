import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [tailwind(), preact()],
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@domain': path.resolve(__dirname, './src/domain'),
        '@application': path.resolve(__dirname, './src/application'),
        '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
        '@presentation': path.resolve(__dirname, './src/presentation'),
      },
    },
  },
});
