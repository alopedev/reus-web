import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// the site's source lives in src/; the build goes to dist/, where check.py serves it from.
// RED swaps the network timetable for another file: check.py's parity build uses a frozen one
// (scripts/baseline/red.json), so the daily timetable refresh never changes its reference frames
const red = process.env.RED;

// the offline worker (src/sw.js) is written with the names of this build's files: it keeps them all on install
const offline = {
  name: 'capacasa-sin-conexion',
  apply: 'build',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter(f => f !== 'index.html').map(f => '/' + f).sort();
    const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
    const source = readFileSync(fileURLToPath(new URL('src/sw.js', import.meta.url)), 'utf8')
      .replace('self.__FILES__', JSON.stringify(files)).replace('self.__VERSION__', JSON.stringify(version));
    this.emitFile({ type: 'asset', fileName: 'sw.js', source });
  },
};

export default defineConfig({
  root: 'src',
  build: { outDir: process.env.OUT_DIR || '../dist', emptyOutDir: true },
  resolve: { alias: red ? [{ find: /^\.\.\/data\/red\.json$/, replacement: fileURLToPath(new URL(red, import.meta.url)) }] : [] },
  plugins: [offline],
});
