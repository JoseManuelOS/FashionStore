// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
// Astro 5.0: Static is default, use `export const prerender = false` for SSR pages
export default defineConfig({
  output: 'static',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});