import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// the site's source lives in src/; the build goes to dist/, where check.py serves it from.
// RED swaps the network timetable for another file: check.py's parity build uses a frozen one
// (scripts/baseline/red.json), so the daily timetable refresh never changes its reference frames
const red = process.env.RED;

// the offline worker (src/sw.js) is written with the names of this build's files: it keeps them on install, all but
// the latin-ext fonts (30-10): nothing the site writes needs them, so the page never asks for them, and keeping them
// cost 60 kB on a first visit. A notice with a rarer letter still gets them from the network
const offline = {
  name: 'capacasa-sin-conexion',
  apply: 'build',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter(f => f !== 'index.html' && !f.includes('latin-ext')).map(f => '/' + f).sort();
    const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
    const source = readFileSync(fileURLToPath(new URL('src/sw.js', import.meta.url)), 'utf8')
      .replace('self.__FILES__', JSON.stringify(files)).replace('self.__VERSION__', JSON.stringify(version));
    this.emitFile({ type: 'asset', fileName: 'sw.js', source });
  },
};

export default defineConfig({
  root: 'src',
  build: {
    outDir: process.env.OUT_DIR || '../dist', emptyOutDir: true,
    // three.js and GSAP in a file of their own (30-10): the robot publishes a new timetable almost every day, and with
    // it the app's file changes name; theirs does not, so a visitor who comes back downloads ~50 kB again, not ~230
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'vendor', test: /node_modules[\\/](three|gsap)[\\/]/ }] } } },
  },
  resolve: { alias: red ? [{ find: /^\.\.\/data\/red\.json$/, replacement: fileURLToPath(new URL(red, import.meta.url)) }] : [] },
  plugins: [offline],
});
