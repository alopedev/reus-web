// the time in Madrid (src/time.ts) and the sun's clock (src/light.ts) are asked for on every redraw, every frame of
// the turn to the table and many times at load: a date formatter is costly to build (0.1–0.16 s of a modest phone's
// load went into building one per call, rendimiento/movil.md, 30-10), so each is built once. `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { madridNow } from '../../src/time.ts';
import { sunTimes } from '../../src/light.ts';

function formattersBuilt(run: () => void): number {
  const Real = Intl.DateTimeFormat;
  let n = 0;
  (Intl as { DateTimeFormat: unknown }).DateTimeFormat = function(...a: ConstructorParameters<typeof Real>){ n++; return new Real(...a); };
  try { run(); } finally { (Intl as { DateTimeFormat: unknown }).DateTimeFormat = Real; }
  return n;
}

test('asking for the time in Madrid again and again builds no new formatter', () => {
  madridNow();
  assert.equal(formattersBuilt(() => { for(let i = 0; i < 50; i++) madridNow(); }), 0);
});

test('the sun on many days builds no new formatter', () => {
  sunTimes('2026-10-30');
  assert.equal(formattersBuilt(() => { for(let d = 1; d <= 28; d++) sunTimes(`2026-02-${String(d).padStart(2, '0')}`); }), 0);
});

test('the time in Madrid is still the time in Madrid', () => {
  const now = madridNow(), parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Madrid', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date());
  const min = +parts.find(p => p.type === 'hour')!.value * 60 + +parts.find(p => p.type === 'minute')!.value;
  assert.ok(Math.abs(now.min - min) <= 1);
  assert.match(now.date, /^\d{4}-\d{2}-\d{2}$/);
});

test('summer time still moves the sun by an hour', () => {
  const [riseWinter] = sunTimes('2026-03-28'), [riseSummer] = sunTimes('2026-03-30');
  assert.ok(riseSummer - riseWinter > 50, `${riseWinter} → ${riseSummer}`);
});
