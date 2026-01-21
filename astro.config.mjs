// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'http://j4o0084kg0ssoo0wc0ocw0g8.victoriafp.online',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3000')
  },
  security: {
    checkOrigin: false
  }
});