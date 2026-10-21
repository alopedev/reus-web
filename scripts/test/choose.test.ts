// what the visitor chooses (src/choose.ts): every control of the hero turns into one choice, and choose() says what
// the view becomes, so each control no longer decides by itself what to forget. Against the frozen timetable, and
// through shown() where what matters is the train that ends up on the board. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose } from '../../src/choose.ts';
import { shown, tomorrowAt } from '../../src/shown.ts';
import type { ViewState } from '../../src/state.ts';

const REUS = '71400', SANTS = '71801', TARRAGONA = '71500';
const HOME: ViewState = { dir: 'casa', useNow: true, minute: null, day: null, ave: false, town: REUS, station: SANTS };
const NOW = { date: '2026-10-01', min: 21 * 60 + 30 }, TOMORROW = '2026-10-02';
const quiet = { line: () => undefined, read: () => null };
const big = (v: ViewState) => { const s = shown(NOW, v, quiet); assert.equal(s.kind, 'train'); return s.kind === 'train' ? s.rows[0] : null; };

test('it never changes the view it is given', () => {
  const v = { ...HOME };
  choose(v, { kind: 'swap' }, NOW);
  choose(v, { kind: 'tomorrow' }, NOW);
  assert.deepEqual(v, HOME);
});

test('now (the platform clock, «avui»): back to now, forgetting the train, its day and the AVE', () => {
  const picked: ViewState = { ...HOME, useNow: false, minute: 1337, ave: true, day: TOMORROW };
  assert.deepEqual(choose(picked, { kind: 'now' }, NOW), { ...HOME });
});

test('«demà»: tomorrow’s train at this time of day', () => {
  const v = choose(HOME, { kind: 'tomorrow' }, NOW);
  assert.deepEqual(v, { ...HOME, useNow: false, ...tomorrowAt(NOW, HOME) });
  assert.equal(v.day, TOMORROW);
});

test('a trip of the board keeps its own day; the ruler picks on the day looked at', () => {
  assert.deepEqual(choose(HOME, { kind: 'trip', minute: 336, ave: false, day: TOMORROW }, NOW), { ...HOME, useNow: false, minute: 336, ave: false, day: TOMORROW });
  assert.deepEqual(choose(HOME, { kind: 'ruler', minute: 663, ave: false }, NOW), { ...HOME, useNow: false, minute: 663, ave: false, day: null });
  const onTomorrow = choose(HOME, { kind: 'tomorrow' }, NOW);
  assert.equal(choose(onTomorrow, { kind: 'ruler', minute: 663, ave: false }, NOW).day, TOMORROW);
  // a train of today picked earlier is not tomorrow looked at
  const today = choose(HOME, { kind: 'trip', minute: 1323, ave: false, day: NOW.date }, NOW);
  assert.equal(choose(today, { kind: 'ruler', minute: 663, ave: false }, NOW).day, null);
});

test('another town or station: from now, or on tomorrow’s train at this time when tomorrow is looked at', () => {
  const picked = choose(HOME, { kind: 'ruler', minute: 1337, ave: true }, NOW);
  assert.deepEqual(choose(picked, { kind: 'town', id: TARRAGONA }, NOW), { ...picked, useNow: true, ave: false, town: TARRAGONA });
  const onTomorrow = choose(HOME, { kind: 'tomorrow' }, NOW);
  const there = choose(onTomorrow, { kind: 'town', id: TARRAGONA }, NOW);
  assert.deepEqual(there, { ...onTomorrow, town: TARRAGONA, useNow: false, ...tomorrowAt(NOW, { ...HOME, town: TARRAGONA }) });
  assert.equal(choose(onTomorrow, { kind: 'station', id: '79400' }, NOW).day, TOMORROW);
});

test('the arrows turn the trip around and keep the moment chosen, tomorrow’s too', () => {
  const onTomorrow = choose(HOME, { kind: 'tomorrow' }, NOW);
  const back = choose(onTomorrow, { kind: 'swap' }, NOW);
  assert.deepEqual(back, { ...onTomorrow, dir: 'bcn' });
  assert.equal(big(back)?.day, TOMORROW);
  assert.deepEqual(choose(back, { kind: 'swap' }, NOW), onTomorrow);
});
