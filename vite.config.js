import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// the site's source lives in src/; the build goes to dist/, where check.py serves it from.
// TRAINS swaps the timetable for another file: check.py's parity build uses a frozen one
// (scripts/baseline/trains.json), so the daily timetable refresh never changes its reference frames
const trains = process.env.TRAINS;
export default defineConfig({
  root: 'src',
  build: { outDir: process.env.OUT_DIR || '../dist', emptyOutDir: true },
  resolve: { alias: trains ? [{ find: /^\.\.\/data\/trains\.json$/, replacement: fileURLToPath(new URL(trains, import.meta.url)) }] : [] },
});
