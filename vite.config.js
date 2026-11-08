import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { split } from './src/split.ts';

// the site's source lives in src/; the build goes to dist/, where check.py serves it from.
// RED swaps the network timetable for another file: check.py's parity build uses a frozen one
// (scripts/baseline/red.json), so the daily timetable refresh never changes its reference frames
const red = process.env.RED;

// the offline worker (src/sw.js) is written with the names of this build's files: it keeps them on install, all but
// the full latin and latin-ext fonts (30-10): the site writes only the letters of the small Catalan files
// (scripts/fuentes.py), so the page never asks for them, and keeping them cost 140 kB on a first visit. A notice
// with a rarer letter still gets them from the network
// every other Rodalies line (data/rodalies.json; Àlex, 08-11: the site serves anyone who lives in Catalonia) is cut in
// two by src/split.ts: the index (stations and stopping patterns) is the module virtual:rodalies, inside the app's
// script; each town's trains are a file of their own, assets/rodalies-<stop_id>-<hash>.json, named by its content so
// it keeps its name, and the browser its copy, while its trains do not change. RODALIES swaps the timetable as RED
// does (the parity build uses the frozen scripts/baseline/rodalies.json)
const rodaliesPath = fileURLToPath(new URL(process.env.RODALIES ?? 'data/rodalies.json', import.meta.url));
let cut = null;
function rodaliesCut(){
  if(cut) return cut;
  const { index, towns } = split(JSON.parse(readFileSync(rodaliesPath, 'utf8')));
  const files = {}, sources = {};
  for(const [id, part] of Object.entries(towns)){
    const source = JSON.stringify(part), name = `rodalies-${id}-${createHash('sha256').update(source).digest('hex').slice(0, 10)}.json`;
    files[id] = name; sources[name] = source;
  }
  return cut = { index, files, sources };
}
const rodalies = {
  name: 'capacasa-rodalies',
  resolveId(id){ return id === 'virtual:rodalies' ? '\0virtual:rodalies' : null; },
  load(id){
    if(id !== '\0virtual:rodalies') return null;
    this.addWatchFile?.(rodaliesPath);
    const { index, files } = rodaliesCut();
    return `export default ${JSON.stringify({ ...index, f: files })};`;
  },
  generateBundle(){
    for(const [name, source] of Object.entries(rodaliesCut().sources)) this.emitFile({ type: 'asset', fileName: `assets/${name}`, source });
  },
  // npm run dev serves them from memory
  configureServer(server){
    server.middlewares.use((req, res, next) => {
      const name = req.url?.match(/\/assets\/(rodalies-[\w-]+\.json)$/)?.[1], source = name && rodaliesCut().sources[name];
      if(!source) return next();
      res.setHeader('Content-Type', 'application/json'); res.end(source);
    });
  },
};

const offline = {
  name: 'capacasa-sin-conexion',
  apply: 'build',
  generateBundle(_, bundle) {
    const all = Object.keys(bundle), parts = all.filter(f => /^assets\/rodalies-/.test(f)).map(f => '/' + f).sort();
    const files = all.filter(f => f !== 'index.html' && !/-latin.*\.woff2$/.test(f) && !/^assets\/rodalies-/.test(f)).map(f => '/' + f).sort();
    const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
    const source = readFileSync(fileURLToPath(new URL('src/sw.js', import.meta.url)), 'utf8')
      .replace('self.__FILES__', JSON.stringify(files)).replace('self.__PARTS__', JSON.stringify(parts)).replace('self.__VERSION__', JSON.stringify(version));
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
  plugins: [rodalies, offline],
});
