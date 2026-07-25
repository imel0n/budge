import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      // Let the SW work in `npm run dev` so you can test install/offline locally.
      devOptions: { enabled: true },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      workbox: {
        // Precache bundled images too — by default only JS/CSS/HTML and the
        // explicitly-declared icons are cached, so imported PNGs 404 offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
      },
      manifest: {
        name: 'Budge',
        short_name: 'Budge',
        description: 'Personal budgeting, made simple.',
        theme_color: '#111111',
        background_color: '#111111',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5175,
    host: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
  },
})
