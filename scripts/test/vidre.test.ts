// the mist on the window (src/vidre.ts, Àlex 08-11, idea 4 B): the first visit finds one word wiped in the mist,
// «Dibuixa», once, remembered in this browser. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HINT, HANDS, handwriting, hintDue, written } from '../../src/vidre.ts';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; };

test('the words in the mist come on the first visit only', () => {
  const store = memory();
  assert.equal(hintDue(store), true);
  assert.equal(hintDue(store), false);
  assert.equal(store.m.get('capacasa.vaho'), '1');
});

test('a browser that keeps nothing still gets the words, and no error', () => {
  assert.equal(hintDue(null), true);
  const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
  assert.equal(hintDue(full), true);
  const blocked = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => {} };
  assert.equal(hintDue(blocked), true);
});

test('the word in the mist is «Dibuixa», on a phone and on a desk alike (Àlex 08-11)', () => {
  assert.equal(HINT, 'Dibuixa');
});

// «Dibuixa» looks written by a finger on the glass (Àlex 08-11): strokes, not a font, drawn in order at a hand's pace
test('the word is a hand’s strokes across the glass, left to right, as wide as it says', () => {
  for(const style of HANDS){
    const s = handwriting(style), xs = s.flatMap(k => k.map(p => p[0]));
    assert.ok(s.length >= 3, style);
    assert.equal(Math.min(...xs), 0, style); assert.equal(Math.max(...xs), 1, style);
    assert.ok(s[0][0][0] < .2, `${style}: starts on the left`);
    assert.ok(s.every(k => k.every(p => Number.isFinite(p[1]) && Math.abs(p[1]) < .5)), `${style}: one line high`);
  }
});

test('the word is written stroke after stroke: nothing at first, all of it at the end', () => {
  const s = handwriting('lligada'), len = (w: [number, number][][]) => w.reduce((a, k) => a + k.length, 0);
  assert.equal(len(written(s, 0)), 0);
  assert.equal(len(written(s, 1)), len(s));
  const half = len(written(s, .5));
  assert.ok(half > 0 && half < len(s));
  assert.ok(len(written(s, .3)) <= half && half <= len(written(s, .7)));
  assert.deepEqual(written(s, 1), s);
});
