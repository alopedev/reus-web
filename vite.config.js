import { defineConfig } from 'vite';

// the site's source lives in src/; the build goes to dist/, where check.py serves it from
export default defineConfig({
  root: 'src',
  build: { outDir: '../dist', emptyOutDir: true },
});
