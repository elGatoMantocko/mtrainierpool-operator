import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset,
  images: [
    'public/pwa-64x64.svg',
    'public/pwa-192x192.svg',
    'public/pwa-512x512.svg',
  ],
});
