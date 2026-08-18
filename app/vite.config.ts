import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Meio a Meio — finanças da família',
        short_name: 'Meio a Meio',
        description: 'Reserva de emergência, contas e gastos da casa em um só lugar.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        importScripts: ['/custom-sw.js'],
        runtimeCaching: [
          {
            // fontes do Google: cache longo
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // API do Supabase: rede primeiro, cache como fallback offline curto
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-rest', networkTimeoutSeconds: 5, expiration: { maxEntries: 60, maxAgeSeconds: 60 * 30 } },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
