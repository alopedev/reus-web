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

// a cancelled train Renfe gives no position for comes by its number in the Rodalies feed (api/retards.ts)
const cancelled = (sec: number, cancelats: string[]) => ({ ...answer(sec, {}), cancelats });

test('a train cancelled without a position is cancelled, whichever way red.json writes its number', async () => {
  const { t, retards, follow } = setup();
  t.next = cancelled(-20, ['15918', '15702']); await follow();
  assert.deepEqual(retards.train('5191M15918R11'), { estat: 'cancelat' });   // an R11 by its whole GTFS id
  assert.deepEqual(retards.train('15702'), { estat: 'cancelat' });           // the same number in both feeds
  assert.deepEqual(retards.train('15035'), { estat: 'sense' });
});

test('an answer from before the cancellations (the CDN keeps one a while) still counts', async () => {
  const { t, retards, follow } = setup();
  t.next = answer(-20, TRENS); await follow();
  assert.deepEqual(retards.train('17505'), TRENS['17505']);
});

test('when the two feeds number a train differently, a cancellation goes to the right one', async () => {
  // 04-11: Sants 19:03 to Reus is the 15039 in AV_LD (red.json's `n`) and the 30519 in Rodalies, whose 15039 is the
  // 20:03 (AV_LD's 15019). red.json keeps Rodalies' number as `f` where it differs
  const trenes = [{ n: '15039', f: '30519' }, { n: '15019', f: '15039' }, { n: '15702' }];
  const t = { next: cancelled(-20, ['15039']) as unknown };
  const retards = createRetards(() => {}, { ask: async () => t.next, clock: () => T0, wait: () => () => {}, hidden: () => false, trenes });
  retards.follow(); await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(retards.train('15019'), { estat: 'cancelat' });
  assert.deepEqual(retards.train('15039'), { estat: 'sense' });
});

// the AVE (04-11): the function answers it apart, from Renfe's long-distance feed; null when that feed failed
test('an AVE by its number, from the AVE part of the answer', async () => {
  const { t, retards, follow } = setup();
  t.next = { ...answer(-20, TRENS), ave: { '03073': { estat: 'circula', retard: 12, parada: '04104' } } }; await follow();
  assert.deepEqual(retards.train('03073'), { estat: 'circula', retard: 12, parada: '04104' });
  assert.deepEqual(retards.train('03062'), { estat: 'sense' });
});

// every fast train (AV, 08-11) comes in Renfe's long-distance feed, whatever Renfe sells it as: an Avant, an Alvia
test('an Avant by its number, from the same long-distance part of the answer', async () => {
  const t = { next: { ...answer(-20, TRENS), ave: { '34609': { estat: 'circula', retard: 6, parada: '79300' } } } };
  const retards = createRetards(() => {}, { ask: async () => t.next, clock: () => T0, wait: () => () => {}, hidden: () => false,
    trenes: [{ n: '34609', p: 'AV' }, { n: '17505', p: 'R15' }] });
  retards.follow(); await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(retards.train('34609'), { estat: 'circula', retard: 6, parada: '79300' });
});

test('the long-distance feed failed, or an answer from before the AVE was read: the AVE unknown, never on time', async () => {
  for(const ave of [null, undefined]){
    const { t, retards, follow } = setup();
    t.next = { ...answer(-20, TRENS), ave }; await follow();
    assert.deepEqual(retards.train('03073'), { estat: 'error' }, String(ave));
    assert.deepEqual(retards.train('17505'), TRENS['17505']);
  }
});
