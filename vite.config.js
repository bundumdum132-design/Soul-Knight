import { defineConfig } from 'vite';

const sourceEntryPreview = {
  name: 'gloamforge-source-entry-preview',
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      if (/^\/(?:index\.html)?(?:\?.*)?$/.test(request.url || '')) request.url = '/dev.html';
      next();
    });
  },
};

export default defineConfig({
  base: './',
  plugins: [sourceEntryPreview],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    modulePreload: { polyfill: false },
    cssCodeSplit: false,
    assetsInlineLimit: 10000000,
    rollupOptions: { input: 'dev.html' },
  },
});
