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
  execFileSync('npx', ['vite', 'build', '--logLevel', 'silent'], { env: { ...process.env, RED: red, OUT_DIR: out }, stdio: 'pipe' });
  const assets = join(out, 'assets');
  const js = new Map(readdirSync(assets).filter(f => f.endsWith('.js')).map(f => [f, gzipSync(readFileSync(join(assets, f))).length]));
  return { js, sw: readFileSync(join(out, 'sw.js'), 'utf8') };
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

test('the offline worker keeps the fonts the page uses (latin), not the latin-ext it never asks for', () => {
  const fonts = [...b.sw.matchAll(/\/assets\/([\w-]+)\.woff2/g)].map(m => m[1]);
  assert.ok(fonts.some(f => f.startsWith('literata-latin-wght')), fonts.join(' '));
  assert.ok(fonts.some(f => f.startsWith('young-serif-latin-400')), fonts.join(' '));
  assert.deepEqual(fonts.filter(f => f.includes('latin-ext')), []);
});
