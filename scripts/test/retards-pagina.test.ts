// the live delays as the page knows them (src/retards.ts), with an answer and a clock of the test's own. `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRetards, type Ask } from '../../src/retards.ts';

const T0 = Date.parse('2026-10-10T15:40:00Z'), MIN = 60e3;
const answer = (sec: number, trens: object) => ({ llegit: new Date(T0 + sec * 1000).toISOString(), trens });
const TRENS = { '17505': { estat: 'circula', retard: 25, parada: '71503' }, '15918': { estat: 'cancelat' } };

function setup(){
  const t = { now: T0, next: null as unknown, asks: 0, changes: 0, hidden: false, timer: null as null | { fn: () => void, ms: number } };
  const ask: Ask = async () => { t.asks++; return t.next; };
  // the timer it sets itself to ask again: the test fires it, as the clock moves
  const wait = (fn: () => void, ms: number) => { t.timer = { fn, ms }; return () => { t.timer = null; }; };
  const retards = createRetards(() => { t.changes++; }, { ask, clock: () => t.now, wait, hidden: () => t.hidden });
  const follow = async () => { retards.follow(); await new Promise(r => setTimeout(r, 0)); };
  return { t, retards, follow };
}

test('a train by its number in red.json, whichever way it is written there', async () => {
  const { t, retards, follow } = setup();
  assert.equal(retards.train('15035'), undefined);               // before the first answer: nothing known yet
  t.next = answer(-20, TRENS); await follow();
  assert.deepEqual(retards.train('17505'), TRENS['17505']);
  assert.deepEqual(retards.train('5191M15918R11'), { estat: 'cancelat' });   // the R11 keep their whole GTFS id
  assert.equal(t.changes, 1);
});

test('a fresh answer without the train: not in the feed yet, which is not unknown', async () => {
  const { t, retards, follow } = setup();
  t.next = answer(-20, TRENS); await follow();
  assert.deepEqual(retards.train('18133'), { estat: 'sense' });
});

test('no answer, one not shaped like one, or one read more than 3 minutes ago: unknown, never on time', async () => {
  for(const body of [null, 'Bad Gateway', { trens: TRENS }, { llegit: answer(0, {}).llegit }, answer(-181, TRENS)]){
    const { t, retards, follow } = setup();
    t.next = body; await follow();
    assert.deepEqual(retards.train('17505'), { estat: 'error' }, JSON.stringify(body));
  }
});

test('it asks at most every 30 s, and the board is redrawn only when something changed', async () => {
  const { t, follow } = setup();
  t.next = answer(-20, TRENS); await follow(); await follow();
  assert.equal(t.asks, 1);
  t.now += 30e3; await follow();
  assert.equal(t.asks, 1);
  t.now += 1; t.next = answer(10, TRENS); await follow();
  assert.equal(t.asks, 2);
  assert.equal(t.changes, 1);                                   // same trains, newer read: nothing to redraw
  t.now += 31e3; t.next = answer(40, { '17505': { estat: 'circula', retard: 27, parada: '71400' } }); await follow();
  assert.equal(t.changes, 2);
});

test('a failed ask keeps the last answer while it is fresh; past 3 minutes the train is unknown', async () => {
  const { t, retards, follow } = setup();
  t.next = answer(-20, TRENS); await follow();
  t.next = null; t.now += 31e3; await follow();
  assert.equal(retards.train('17505')?.estat, 'circula');
  assert.equal(t.changes, 1);
  t.now += 3 * MIN; await follow();
  assert.deepEqual(retards.train('17505'), { estat: 'error' });
  assert.equal(t.changes, 2);
});

test('it asks again on its own every 30 s, without waiting for the board to be redrawn (once a minute)', async () => {
  const { t, follow } = setup();
  t.next = answer(-20, TRENS); await follow();
  assert.ok(t.timer && t.timer.ms > 30e3 && t.timer.ms < 31e3, JSON.stringify(t.timer));
  t.now += t.timer.ms; t.timer.fn(); await new Promise(r => setTimeout(r, 0));
  assert.equal(t.asks, 2);
  // with the tab hidden it does not ask: the next redraw, when it comes back, will
  t.now += t.timer!.ms; t.hidden = true; t.timer!.fn(); await new Promise(r => setTimeout(r, 0));
  assert.equal(t.asks, 2);
});

test('with the tab hidden the board\'s minute redraw does not ask either; back in sight, it asks at once', async () => {
  const { t, follow } = setup();
  t.next = answer(-20, TRENS); await follow();
  t.hidden = true;
  for(let i = 0; i < 10; i++){ t.now += MIN; await follow(); }
  assert.equal(t.asks, 1);
  t.hidden = false; await follow();
  assert.equal(t.asks, 2);
});
