// the lines' notices (src/avisos.ts): what the page knows of each line after asking /api/avisos, with an answer and a
// clock of the test's own. `npm test`, no browser: check.py keeps how they look
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAvisos, lineNews, notices, gist, type Ask } from '../../src/avisos.ts';

const T0 = Date.parse('2026-10-10T08:00:00Z'), MIN = 60e3;
const answer = (min: number, linies: object) => ({ llegit: new Date(T0 + min * MIN).toISOString(), linies });
const AVIS = { R15: { estat: 'avis', text: 'Servei alternatiu per carretera entre Reus i Riudecanyes.', publicat: null }, R13: { estat: 'normal' } };

// a function that answers what the test puts in `next`, and a clock the test moves
function setup(){
  const t = { now: T0, next: null as unknown, asks: 0, changes: 0 };
  const ask: Ask = async () => { t.asks++; return t.next; };
  const avisos = createAvisos(() => { t.changes++; }, { ask, clock: () => t.now });
  // follow() asks without waiting: let its answer land
  const follow = async () => { avisos.follow(); await new Promise(r => setTimeout(r, 0)); };
  return { t, avisos, follow };
}

test('before the first answer nothing is known, and the sheet says it is asking', () => {
  const { avisos } = setup();
  assert.equal(avisos.line('R15'), undefined);
  assert.equal(avisos.now(), null);
  assert.deepEqual(lineNews(avisos, 'R15', false), { kind: 'pending', line: 'R15' });
});

test('an answer: a notice on one line, normal on another, unknown on a line it does not name', async () => {
  const { t, avisos, follow } = setup();
  t.next = answer(-1, AVIS); await follow();
  assert.equal(t.changes, 1);
  assert.deepEqual(notices(avisos, ['R15', 'R13', 'R14']), [{ line: 'R15', text: AVIS.R15.text }]);
  assert.equal(lineNews(avisos, 'R13', false).kind, 'normal');
  assert.equal(lineNews(avisos, 'R14', false).kind, 'error');
  assert.equal(lineNews(avisos, 'R15', true).kind, 'ave');      // the AVE has no notices, whatever its line says
  assert.equal(avisos.read(), answer(-1, {}).llegit);
});

test('it asks at most every 2 minutes', async () => {
  const { t, follow } = setup();
  t.next = answer(0, AVIS); await follow(); await follow();
  assert.equal(t.asks, 1);
  t.now += 2 * MIN; await follow();
  assert.equal(t.asks, 1);
  t.now += 1; await follow();
  assert.equal(t.asks, 2);
});

test('a failed ask keeps the last answer while it is fresh, so one bad minute does not blink', async () => {
  const { t, avisos, follow } = setup();
  t.next = answer(0, AVIS); await follow();
  t.next = null; t.now += 3 * MIN; await follow();
  assert.equal(avisos.line('R15')?.estat, 'avis');
  assert.equal(t.changes, 1);                                   // nothing changed: the board is not redrawn
  // past half an hour that answer is too old to show: unknown, never «all is well»
  t.now += 28 * MIN; await follow();
  assert.deepEqual(avisos.line('R15'), { estat: 'error' });
  assert.equal(avisos.now(), 'error');
  assert.equal(t.changes, 2);
});

test('an answer read more than half an hour ago, or not shaped like one, is not shown', async () => {
  for(const body of [answer(-31, AVIS), { linies: AVIS }, { llegit: answer(0, {}).llegit }, 'Service Unavailable']){
    const { t, avisos, follow } = setup();
    t.next = body; await follow();
    assert.deepEqual(avisos.line('R15'), { estat: 'error' }, JSON.stringify(body));
  }
});

test('the stamp says a notice in a few words', () => {
  assert.equal(gist(AVIS.R15.text), 'per carretera');
  assert.equal(gist('Retards de fins a 15 minuts'), 'amb retards');
  assert.equal(gist('Obres a Sant Vicenç'), 'mira’l');
});
