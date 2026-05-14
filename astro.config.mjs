import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
const site = process.env.SITE_URL || '';
export default defineConfig({
  site, base: '/',
  integrations: [sitemap()],
  output: 'static',
  build: { inlineStylesheets: 'auto' },
});
