import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  test: {
    include: ['src/testes/**/*.test.js'],
  },
  plugins: [
    react(),
    VitePWA({
      // A versão nova espera o momento seguro: quem a aplica é o componente AtualizacaoApp
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons.svg', 'apple-touch-icon.png', 'imagens/*.{png,svg}', 'modelo_planilha.xlsx'],
      manifest: {
        name: 'Rota Acessível',
        short_name: 'Rota Acessível',
        description: 'Rota Acessível: vistoria de acessibilidade em escolas com base na NBR 9050:2020',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        categories: ['education', 'productivity', 'utilities'],
        icons: [
          { src: '/rota-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/rota-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/rota-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2,xlsx}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
});
