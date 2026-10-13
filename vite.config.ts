import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: Object.fromEntries(['index', 'museum', 'artist', 'gallery', 'contact', 'sound-map'].map(name => [name, resolve(import.meta.dirname, `${name}.html`)])),
      output: { manualChunks: { three: ['three'] } }
    }
  }
});
