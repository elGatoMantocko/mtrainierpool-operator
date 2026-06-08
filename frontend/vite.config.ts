import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
const CERT_DIR = '../supabase/certs';

export default defineConfig(({ command }) => {
  const keyPath = fs.realpathSync(`${CERT_DIR}/privkey.pem`);
  const certPath = fs.realpathSync(`${CERT_DIR}/fullchain.pem`);

  const httpsConfig = command !== 'build'
    ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
    : undefined;

  const supabaseProxy = {
    target: 'http://localhost:54321',
    changeOrigin: true,
  };

  return {
    server: {
      https: httpsConfig,
      host: '0.0.0.0',
      allowedHosts: ['.mantock.com'],
      proxy: {
        '/rest/v1': supabaseProxy,
        '/auth/v1': supabaseProxy,
        '/storage/v1': supabaseProxy,
        '/functions/v1': supabaseProxy,
        '/realtime/v1': {
          ...supabaseProxy,
          target: 'ws://localhost:54321',
          ws: true,
        },
      },
    },
    preview: {
      https: httpsConfig,
      host: '0.0.0.0',
      allowedHosts: ['.mantock.com'],
    },
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        quoteStyle: 'single',
        semicolons: true,
      }),
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        // injectRegister: null,
        devOptions: { enabled: true, type: 'module' },
        manifest: {
          name: 'Mt. Rainier Pool Checker',
          short_name: 'swim',
          description: 'Check the current status of the Mt. Rainier pool',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
  };
});
