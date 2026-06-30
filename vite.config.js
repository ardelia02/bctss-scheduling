import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild', // esbuild is built into Vite — no extra install needed
  },
});
