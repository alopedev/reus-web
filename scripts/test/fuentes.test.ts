// the two letters, cut to what the site writes (rendimiento/carga.md, 30-10): the latin files of Google's subsets
// carry Vietnamese, Icelandic, Polish… letters the site never shows. A small file per family (src/styles/fuentes/,
// drawn by scripts/fuentes.py) holds the Catalan the site writes; the full latin files stay behind it for any
// other letter, and the browser downloads them only if one turns up. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';

const root = new URL('../../', import.meta.url);
const read = (f: string) => readFileSync(new URL(f, root), 'utf8');

type Face = { family: string, weight: string, src: string, range: Set<number> };

// U+0000-00FF, U+0131 → every code point it names
function codes(range: string) {
  const out = new Set<number>();
  for (const part of range.split(',')) {
    const [a, b] = part.trim().replace(/^U\+/i, '').split('-').map(x => parseInt(x, 16));
    for (let c = a; c <= (b ?? a); c++) out.add(c);
  }
  return out;
}

const faces: Face[] = [...read('src/styles/fonts.css').matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
  const get = (k: string) => body.match(new RegExp(`${k}:\\s*([^;]+);`))![1].trim();
  return { family: get('font-family').replace(/'/g, ''), weight: get('font-weight'),
    src: get('src').match(/url\('([^']+)'\)/)![1], range: codes(get('unicode-range')) };
});
const small = (f: Face) => f.src.startsWith('./fuentes/');
const full = (f: Face) => f.src.includes('-latin-') && !f.src.includes('-latin-ext-');

// what the site writes: its words in the TypeScript (comments left out), the page's own text, the station names
// (the frozen timetable: the daily one may bring a new name, and a new letter must never stop the timetable robot;
// it only makes the browser fetch the full file) and their capitals, for what goes in uppercase
function written() {
  const ts = readdirSync(new URL('src/', root)).filter(f => f.endsWith('.ts')).map(f => read(`src/${f}`)).join('\n')
    .replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/[^\n]*/g, '$1');
  const html = read('src/index.html').replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]*>/g, ' ');
  const names = Object.values(JSON.parse(read('scripts/baseline/red.json')).estaciones as Record<string, { nombre: string }>)
    .map(e => e.nombre).join(' ');
  let ascii = ''; for (let c = 0x20; c < 0x7f; c++) ascii += String.fromCharCode(c);
  const text = ascii + ts + html + names + names.toUpperCase();
  return new Set([...text].map(c => c.codePointAt(0)!).filter(c => c >= 0x20 && (c < 0x300 || c > 0x36f)));   // no line breaks, nor the accents a regex strips
}

// the code points a woff2 file draws: its cmap, which woff2 keeps untransformed inside the one brotli stream
function drawn(file: URL) {
  const b = readFileSync(file);
  const n = b.readUInt16BE(12), size = b.readUInt32BE(20);
  const tags = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ',
    'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB',
    'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar',
    'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf',
    'Glat', 'Gloc', 'Feat', 'Sill'];
  let at = 48;
  const base128 = () => { let v = 0; for (;;) { const x = b[at++]; v = v * 128 + (x & 127); if (!(x & 128)) return v; } };
  const tables: [string, number][] = [];
  for (let i = 0; i < n; i++) {
    const flags = b[at++];
    const tag = (flags & 63) === 63 ? b.toString('latin1', at, (at += 4)) : tags[flags & 63];
    const version = flags >> 6, original = base128();
    const transformed = (tag === 'glyf' || tag === 'loca') ? version === 0 : version !== 0;
    tables.push([tag, transformed ? base128() : original]);
  }
  const data = brotliDecompressSync(b.subarray(at, at + size));
  let off = 0; for (const [tag, len] of tables) { if (tag === 'cmap') break; off += len; }
  const cmap = data.subarray(off), out = new Set<number>();
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const t = cmap.subarray(cmap.readUInt32BE(8 + i * 8)), format = t.readUInt16BE(0);
    if (format === 4) {
      const segs = t.readUInt16BE(6) / 2;
      for (let s = 0; s < segs; s++) {
        const end = t.readUInt16BE(14 + s * 2), start = t.readUInt16BE(16 + segs * 2 + s * 2);
        const delta = t.readInt16BE(16 + segs * 4 + s * 2), roAt = 16 + segs * 6 + s * 2, ro = t.readUInt16BE(roAt);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          const g = ro ? t.readUInt16BE(roAt + ro + (c - start) * 2) : (c + delta) & 0xffff;
          if (g) out.add(c);
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < t.readUInt32BE(12); g++) {
        const s = t.subarray(16 + g * 12);
        for (let c = s.readUInt32BE(0); c <= s.readUInt32BE(4); c++) out.add(c);
      }
    }
  }
  return out;
}

test('each family and weight has a small file of its own', () => {
  for (const [family, weight] of [['Young Serif', '400'], ['Literata', '500'], ['Literata', '700']])
    assert.ok(faces.some(f => small(f) && f.family === family && f.weight === weight), `${family} ${weight}`);
});

test('every letter the site writes comes from the small file, so the full latin file is never downloaded', () => {
  const letters = written();
  for (const f of faces.filter(small)) {
    const latin = faces.find(g => full(g) && g.family === f.family && g.weight === f.weight)!;
    const missing = [...letters].filter(c => latin.range.has(c) && !f.range.has(c));
    assert.deepEqual(missing.map(c => String.fromCodePoint(c)), [], `${f.family} ${f.weight}`);
  }
});

test('a small file draws every letter its unicode-range promises, and the range promises no more', () => {
  for (const f of faces.filter(small)) {
    const has = drawn(new URL(`src/styles/${f.src.slice(2)}`, root));
    assert.deepEqual([...f.range].filter(c => !has.has(c)).map(c => String.fromCodePoint(c)), [], `${f.src}: promised, not drawn`);
  }
});

test('the small faces come after the full ones: for a letter in both, the browser takes the last one declared', () => {
  for (const f of faces.filter(small)) {
    const last = faces.findLastIndex(g => full(g) && g.family === f.family && g.weight === f.weight);
    assert.ok(faces.indexOf(f) > last, `${f.family} ${f.weight}`);
  }
});
