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
      // O manifesto fica em public/manifest.webmanifest, fora do pré-cache: o Chrome confere nome e
      // ícones do app instalado por ele, e o service worker antigo responderia com a versão antiga
      // até a nova ser aplicada. Ele vem sempre da rede, com o cache só para quando não há internet.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2,xlsx}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/manifest.webmanifest'),
            handler: 'NetworkFirst',
            options: { cacheName: 'manifesto', networkTimeoutSeconds: 4 },
          },
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
