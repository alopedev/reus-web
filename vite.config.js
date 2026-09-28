import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// the site's source lives in src/; the build goes to dist/, where check.py serves it from.
// RED swaps the network timetable for another file: check.py's parity build uses a frozen one
// (scripts/baseline/red.json), so the daily timetable refresh never changes its reference frames
const red = process.env.RED;
export default defineConfig({
  root: 'src',
  build: { outDir: process.env.OUT_DIR || '../dist', emptyOutDir: true },
  resolve: { alias: red ? [{ find: /^\.\.\/data\/red\.json$/, replacement: fileURLToPath(new URL(red, import.meta.url)) }] : [] },
});
