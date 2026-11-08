import { defineConfig } from 'vite';
export default defineConfig({
  server: { host: true, port: 5173, proxy: { '/ws': { target: 'ws://localhost:8787', ws: true }, '/qr': 'http://localhost:8787' } },
  build: { target: 'es2020', assetsInlineLimit: 2048, chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : id.includes('node_modules') ? 'vendor' : undefined) } } },
});
