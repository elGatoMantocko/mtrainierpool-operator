import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
const CERT_DIR = '../supabase/certs';

export default defineConfig(({ command }) => {
  const certsExist = command !== 'build' &&
    fs.existsSync(`${CERT_DIR}/privkey.pem`) &&
    fs.existsSync(`${CERT_DIR}/fullchain.pem`);

  const httpsConfig = certsExist
    ? {
      key: fs.readFileSync(fs.realpathSync(`${CERT_DIR}/privkey.pem`)),
      cert: fs.readFileSync(fs.realpathSync(`${CERT_DIR}/fullchain.pem`)),
    }
    : undefined;

  return {
    server: {
      https: httpsConfig,
      host: '0.0.0.0',
      allowedHosts: ['.mantock.com'],
      proxy: {
        '/rest/v1': {
          target: 'http://supabase_kong_swimming:8000',
          changeOrigin: true,
        },
        '/auth/v1': {
          target: 'http://supabase_kong_swimming:8000',
          changeOrigin: true,
        },
        '/storage/v1': {
          target: 'http://supabase_kong_swimming:8000',
          changeOrigin: true,
        },
        '/functions/v1': {
          target: 'http://supabase_kong_swimming:8000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      https: httpsConfig,
      host: '0.0.0.0',
      allowedHosts: ['.mantock.com'],
      proxy: {
        '/rest/v1': {
          target: 'http://supabase_kong_swimming:8000',
          changeOrigin: true,
        },
        '/auth/v1': {
          target: 'http://supabase_kong_swimming:8000',
          changeOrigin: true,
        },
        '/storage/v1': {
          target: 'http://supabase_kong_swimming:8000',
          changeOrigin: true,
        },
        '/functions/v1': {
          target: 'http://supabase_kong_swimming:8000',
          changeOrigin: true,
        },
      },
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
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
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
