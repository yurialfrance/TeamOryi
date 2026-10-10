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
      // the icon PNGs are already precached by globPatterns; .ico isn't, so list it here.
      // icon-master-500.png (source for `npm run cap:icons`) is excluded in globIgnores below.
      includeAssets: ['favicon.ico', 'pipo/*.png'],
      includeManifestIcons: false, // globPatterns already precaches them (avoids duplicate entries)
      manifest: {
        name: 'Sipnayan — Math na Masaya',
        short_name: 'Sipnayan',
        description: 'Duolingo-style math learning in Taglish, aligned to DepEd & CHED. 100% offline AI tutor.',
        theme_color: '#1E90DC', // the icon's sky blue (maskable-icon background)
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          // "any": transparent rounded-square icon; "maskable": same art inside the safe zone on an opaque sky-blue field
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        // webp = Pipo's mascot art (public/mascot), mp3 = Pipo's voice-overs (public/voice-overs):
        // both ~1.5 MB and needed on nearly every screen, so they're precached for offline use
        globPatterns: ['**/*.{js,css,html,svg,png,webp,mp3,woff2,ttf,wasm}'], // the plugin adds manifest.webmanifest itself
        // jsPDF's optional html()/SVG helpers (html2canvas, DOMPurify, canvg) are never called by the
        // report renderer — don't spend ~380 KB of every install on them
        globIgnores: ['icon-master-500.png', '**/html2canvas-*.js', '**/purify.es-*.js', '**/index.es-*.js'],
        dontCacheBustURLsMatching: /\.[a-f0-9]{8}\./,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  worker: { format: 'es' },
})
