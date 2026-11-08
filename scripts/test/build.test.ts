// what a visitor downloads again when the robot publishes a new timetable (almost every day, horarios.yml), and what
// the offline worker keeps: two real builds (vite build) of two timetables that differ in one day. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const tmp = mkdtempSync(join(tmpdir(), 'capacasa-build-'));
const frozen = JSON.parse(readFileSync('scripts/baseline/red.json', 'utf8'));
const today = join(tmp, 'avui.json'), tomorrow = join(tmp, 'dema.json');
writeFileSync(today, JSON.stringify(frozen));
writeFileSync(tomorrow, JSON.stringify({ ...frozen, actualizado: '2099-01-01' }));

function build(red: string, out: string){
  execFileSync('npx', ['vite', 'build', '--logLevel', 'silent'], { env: { ...process.env, RED: red, RODALIES: 'scripts/baseline/rodalies.json', OUT_DIR: out }, stdio: 'pipe' });
  const assets = join(out, 'assets'), files = readdirSync(assets);
  const js = new Map(files.filter(f => f.endsWith('.js')).map(f => [f, gzipSync(readFileSync(join(assets, f))).length]));
  return { js, files, assets, sw: readFileSync(join(out, 'sw.js'), 'utf8') };
}
const a = build(today, join(tmp, 'a')), b = build(tomorrow, join(tmp, 'b'));

test('a new timetable is a small download for a visitor who comes back: three.js and GSAP keep their file', () => {
  const again = [...b.js].filter(([f]) => !a.js.has(f)).reduce((n, [, bytes]) => n + bytes, 0);
  const all = [...b.js.values()].reduce((n, bytes) => n + bytes, 0);
  assert.ok(again > 0, 'the timetable is in some file');
  assert.ok(again < 80e3, `${Math.round(again / 1e3)} kB of ${Math.round(all / 1e3)} kB gzipped downloaded again`);
});

test('the offline worker keeps every script of the build, so the page opens without a connection', () => {
  for(const f of b.js.keys()) assert.ok(b.sw.includes(`/assets/${f}`), f);
});

test('the offline worker keeps the fonts the page uses (the small Catalan files), not the full latin ones it never asks for', () => {
  const fonts = [...b.sw.matchAll(/\/assets\/([\w-]+)\.woff2/g)].map(m => m[1]);
  assert.ok(fonts.some(f => f.startsWith('literata-catala-wght')), fonts.join(' '));
  assert.ok(fonts.some(f => f.startsWith('young-serif-catala')), fonts.join(' '));
  assert.deepEqual(fonts.filter(f => f.includes('-latin')), []);
});

// every Rodalies line (Àlex, 08-11): 80 kB with gzip, so each town's trains go in a file of their own, fetched when the
// town is chosen (src/rodalies.ts) and kept then by the worker; the scripts carry only the index (src/split.ts)
test('each Rodalies town has its own file of trains, named by its content, and the scripts only the index', () => {
  const mataro = b.files.filter(f => /^rodalies-79500-[\w-]+\.json$/.test(f));
  assert.equal(mataro.length, 1, b.files.filter(f => f.startsWith('rodalies-')).slice(0, 5).join(' '));
  assert.ok(a.files.includes(mataro[0]), 'a new regional timetable keeps the name of an unchanged town file');
  const part = JSON.parse(readFileSync(join(b.assets, mataro[0]), 'utf8'));
  assert.ok(part.t.length > 50 && Object.keys(part.dias).length === 14, `${part.t.length} trains`);
  assert.ok(!b.files.some(f => /^rodalies-(71801|78805)-/.test(f)), 'no file for a Barcelona station');
  const app = [...b.js].filter(([f]) => !f.startsWith('vendor')).reduce((n, [, bytes]) => n + bytes, 0);
  assert.ok(app < 80e3, `${Math.round(app / 1e3)} kB gzipped of app scripts`);
});
test('the offline worker does not keep every town\'s file on install, but knows them, to keep the one already fetched', () => {
  const installs: string[] = JSON.parse(b.sw.match(/const FILES = (\[.*?\]);/)![1]);
  assert.deepEqual(installs.filter(f => f.includes('rodalies-')), []);
  assert.match(b.sw, /\/assets\/rodalies-79500-[\w-]+\.json/);
});
