// the highlighted time, «only if you hesitate» (option C, Àlex 12-10): raised until it is first pressed; a sweep of
// light once if nothing is touched 5 s after the hero comes in; a beat and the sweep when a touch lands where nothing
// answers; flat and quiet once pressed, also on the next visit. `npm test`, no browser: check.py keeps how it looks
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHint, type Look } from '../../src/hint.ts';

// a storage, a timer the test fires by hand, and every look the page is told to show
function setup(opts: { still?: boolean, stored?: Record<string, string>, broken?: boolean } = {}){
  const data: Record<string, string> = { ...opts.stored };
  const store = opts.broken
    ? { getItem(): string | null { throw new Error('blocked'); }, setItem(): void { throw new Error('blocked'); } }
    : { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v; } };
  const timers: { f: () => void, ms: number, off: boolean }[] = [];
  const later = (f: () => void, ms: number) => { const t = { f, ms, off: false }; timers.push(t); return () => { t.off = true; }; };
  const fire = () => timers.filter(t => !t.off).forEach(t => { t.off = true; t.f(); });
  const looks: Look[] = [];
  const hint = createHint(l => looks.push(l), { store, later, still: opts.still ?? false });
  return { hint, data, timers, fire, looks };
}

test('a first visit: the time is raised and still until the hero comes in', () => {
  const { hint, timers } = setup();
  assert.deepEqual(hint.look(), { raised: true, shine: 0, beat: 0 });
  assert.equal(timers.length, 0);
});

test('nothing touched 5 s after the hero comes in: the light sweeps the time once', () => {
  const { hint, timers, fire } = setup();
  hint.enter();
  assert.deepEqual(timers.map(t => t.ms), [5000]);
  fire();
  assert.deepEqual(hint.look(), { raised: true, shine: 1, beat: 0 });
  hint.enter();                                            // the hero comes in again (a repaint): no second sweep
  fire();
  assert.equal(hint.look().shine, 1);
});

test('a touch where nothing answers: the time beats and the light sweeps it, every time; the idle sweep is dropped', () => {
  const { hint, fire, looks } = setup();
  hint.enter(); hint.miss();
  assert.deepEqual(hint.look(), { raised: true, shine: 1, beat: 1 });
  fire();                                                  // the 5 s are up: no sweep of its own any more
  assert.equal(hint.look().shine, 1);
  hint.miss();
  assert.deepEqual(hint.look(), { raised: true, shine: 2, beat: 2 });
  assert.equal(looks.length, 2);
});

test('pressed: flat, quiet and remembered; the next visit starts flat', () => {
  const { hint, data, fire } = setup();
  hint.enter(); hint.press();
  fire(); hint.miss();
  assert.deepEqual(hint.look(), { raised: false, shine: 0, beat: 0 });
  const next = setup({ stored: data });
  assert.equal(next.hint.look().raised, false);
  next.hint.enter(); next.hint.miss();
  assert.equal(next.timers.length, 0);
  assert.deepEqual(next.hint.look(), { raised: false, shine: 0, beat: 0 });
});

test('reduced motion: only the relief, no sweep and no beat', () => {
  const { hint, timers } = setup({ still: true });
  hint.enter(); hint.miss();
  assert.equal(timers.length, 0);
  assert.deepEqual(hint.look(), { raised: true, shine: 0, beat: 0 });
  hint.press();
  assert.equal(hint.look().raised, false);
});

test('a browser that keeps nothing (private window, blocked storage): raised each visit, flat once pressed', () => {
  const { hint } = setup({ broken: true });
  assert.equal(hint.look().raised, true);
  hint.press();
  assert.equal(hint.look().raised, false);
});
