import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/ — the deploy workflow sets BASE_PATH
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pipo/*.png'],
      manifest: {
        name: 'Sipnayan — Math na Masaya',
        short_name: 'Sipnayan',
        description: 'Duolingo-style math learning in Taglish, aligned to DepEd & CHED. 100% offline AI tutor.',
        theme_color: '#2F6BFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,wasm,webmanifest}'],
        dontCacheBustURLsMatching: /\.[a-f0-9]{8}\./,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  worker: { format: 'es' },
})
