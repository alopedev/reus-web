// the trip is remembered (src/remember.ts): the town, the Barcelona station and the direction the visitor last chose
// come back on the next visit, in this browser only. A store that is missing, full, blocked or holds something the
// timetable no longer knows gives the defaults back, never an error. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keep, recall } from '../../src/remember.ts';

const GIRONA = '79300', FRANCA = '79400', REUS = '71400', SANTS = '71801';
const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; };

test('a trip kept comes back on the next visit', () => {
  const store = memory();
  keep(store, { dir: 'bcn', town: GIRONA, station: FRANCA });
  assert.deepEqual(recall(store), { dir: 'bcn', town: GIRONA, station: FRANCA });
});

test('a first visit has nothing to recall', () => {
  assert.deepEqual(recall(memory()), {});
  assert.deepEqual(recall(null), {});
});

test('a town or a station the timetable no longer offers is forgotten, the rest kept', () => {
  const store = memory();
  store.setItem('capacasa.viatge', JSON.stringify({ dir: 'bcn', town: '87000', station: '00000' }));
  assert.deepEqual(recall(store), { dir: 'bcn' });
  store.setItem('capacasa.viatge', JSON.stringify({ dir: 'enlloc', town: REUS, station: SANTS }));
  assert.deepEqual(recall(store), { town: REUS, station: SANTS });
});

test('whatever else is in the store gives the defaults back', () => {
  const store = memory();
  for(const junk of ['{', 'null', '42', '"Reus"', '[]'])
    { store.setItem('capacasa.viatge', junk); assert.deepEqual(recall(store), {}, junk); }
});

test('a store that throws (private window, blocked site data) is never an error', () => {
  const broken = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceededError'); } };
  assert.deepEqual(recall(broken), {});
  assert.doesNotThrow(() => keep(broken, { dir: 'casa', town: REUS, station: SANTS }));
});
