// the mist on the window (src/vidre.ts, Àlex 08-11, idea 4 B): the first visit finds one word wiped in the mist,
// «Dibuixa», once, remembered in this browser. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HINT, hintDue } from '../../src/vidre.ts';

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
