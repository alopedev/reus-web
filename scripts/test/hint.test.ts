// the highlighted time, «only if you hesitate» (option C, Àlex 12-10; without the sweep of light, Àlex 12-10): raised
// until it is first pressed; a beat when a touch lands where nothing answers; flat and quiet once pressed, also on the
// next visit. `npm test`, no browser: check.py keeps how it looks
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHint, type Look } from '../../src/hint.ts';

// a storage and every look the page is told to show
function setup(opts: { still?: boolean, stored?: Record<string, string>, broken?: boolean } = {}){
  const data: Record<string, string> = { ...opts.stored };
  const store = opts.broken
    ? { getItem(): string | null { throw new Error('blocked'); }, setItem(): void { throw new Error('blocked'); } }
    : { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v; } };
  const looks: Look[] = [];
  const hint = createHint(l => looks.push(l), { store, still: opts.still ?? false });
  return { hint, data, looks };
}

test('a first visit: the time is raised and nothing moves', () => {
  const { hint, looks } = setup();
  assert.deepEqual(hint.look(), { raised: true, beat: 0 });
  assert.equal(looks.length, 0);
});

test('a touch where nothing answers: the time beats, every time', () => {
  const { hint, looks } = setup();
  hint.miss();
  assert.deepEqual(hint.look(), { raised: true, beat: 1 });
  hint.miss();
  assert.deepEqual(hint.look(), { raised: true, beat: 2 });
  assert.equal(looks.length, 2);
});

test('pressed: flat, quiet and remembered; the next visit starts flat', () => {
  const { hint, data } = setup();
  hint.miss(); hint.press(); hint.miss();
  assert.deepEqual(hint.look(), { raised: false, beat: 0 });
  const next = setup({ stored: data });
  next.hint.miss();
  assert.deepEqual(next.hint.look(), { raised: false, beat: 0 });
  assert.equal(next.looks.length, 0);
});

test('reduced motion: only the relief, no beat', () => {
  const { hint } = setup({ still: true });
  hint.miss();
  assert.deepEqual(hint.look(), { raised: true, beat: 0 });
  hint.press();
  assert.equal(hint.look().raised, false);
});

test('a browser that keeps nothing (private window, blocked storage): raised each visit, flat once pressed', () => {
  const { hint } = setup({ broken: true });
  assert.equal(hint.look().raised, true);
  hint.press();
  assert.equal(hint.look().raised, false);
});
