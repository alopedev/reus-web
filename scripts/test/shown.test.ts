// which train the hero shows (src/shown.ts), against the frozen timetable (scripts/baseline/red.json, 28-09 to 11-10
// of 2026). `npm test`, in a second, no browser: check.py keeps the look, these keep the rules
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shown, type Shown } from '../../src/shown.ts';
import type { ViewState } from '../../src/state.ts';

const REUS = '71400', SANTS = '71801', FRANCA = '79400', GIRONA = '79300';
const HOME: ViewState = { dir: 'casa', useNow: true, minute: null, ave: false, town: REUS, station: SANTS };
const BACK: ViewState = { ...HOME, dir: 'bcn' };
// no notices known yet
const quiet = { line: () => undefined, read: () => null };
const at = (date: string, hm: string, v: ViewState): Shown => { const [h, m] = hm.split(':').map(Number); return shown({ date, min: h * 60 + m }, v, quiet); };
const train = (s: Shown) => { assert.equal(s.kind, 'train'); return s as Extract<Shown, { kind: 'train' }>; };
const rows = (s: Shown) => train(s).rows.map(r => `${r.line} ${r.dep} ${r.big ? 'big' : ''}${r.until}${r.morrow ? 'demà' : ''}`);

test('a weekday morning, Sants → Reus: the next regional big, with its countdown, and the one after it', () => {
  const s = train(at('2026-10-01', '10:00', HOME));
  assert.deepEqual(rows(s), ['R15 603 big3 min', 'R15 663 ']);
  assert.equal(s.say, 'Pròxim tren: 10:03, de Sants a Reus; arriba a les 11:33.');
  assert.equal(s.label, '');
  assert.equal(s.note, '');
  assert.equal(s.knob, 603);
  assert.equal(s.valuetext, 'tren de les 10:03');
  assert.equal(s.light, 600);
  assert.equal(s.day, '2026-10-01');
  assert.deepEqual(s.lines, ['R15']);
  assert.equal(s.trip.when, 'Surt en 3 min');
  assert.equal(s.trip.home, 'Agafo l’R15 de les 10:03 a Sants. Arribo a Reus a les 11:33.');
  assert.equal(s.ruler.filter(m => m.on).length, 1);
});

test('Reus → Sants at night: today’s last AVE first, then tomorrow’s first regional with «demà»', () => {
  const s = train(at('2026-10-01', '21:30', BACK));
  assert.equal(s.label, 'Avui ja no queden regionals');
  assert.deepEqual(rows(s), ['AVE 1337 big47 min', 'R15 336 demà']);
  assert.equal(s.ave, true);
  assert.equal(s.say, 'Pròxim tren: 22:17, AVE de Camp de Tarragona a Barcelona Sants; arriba a les 22:59.');
  assert.equal(s.trip.ave, 'L’AVE no surt de Reus: surt de Camp de Tarragona.');
  assert.equal(s.trip.news.kind, 'ave');
  // the AVE has no notices: only the regional's line goes to the stamp
  assert.deepEqual(s.lines, ['R15']);
  assert.equal(s.day, '2026-10-01');
});

test('nothing left today: tomorrow’s first trains, the ruler stands on now', () => {
  const s = train(at('2026-10-01', '23:10', BACK));
  assert.equal(s.label, 'Avui ja no en queden · demà');
  assert.deepEqual(rows(s), ['R15 336 big', 'R15 366 ']);
  assert.equal(s.knob, null);
  assert.equal(s.valuetext, 'avui ja no queden trens');
  assert.equal(s.day, '2026-10-02');
  assert.equal(s.light, 336);
  assert.equal(s.trip.when, 'Demà');
  assert.match(s.trip.home, /^Demà agafo /);
  assert.match(s.buy, /FechaIdaSel=02%2F10%2F2026/);
  assert.ok(s.ruler.every(m => !m.on));
});

test('a train picked on the ruler: the AVE when the AVE was picked, the regional otherwise', () => {
  const ave = train(at('2026-10-01', '10:00', { ...BACK, useNow: false, minute: 1337, ave: true }));
  assert.equal(ave.ave, true);
  assert.equal(ave.say.startsWith('Tren triat: 22:17, AVE'), true);
  assert.equal(ave.rows[0].until, '');                       // no countdown away from now
  const reg = train(at('2026-10-01', '10:00', { ...HOME, useNow: false, minute: 663 }));
  assert.deepEqual(rows(reg), ['R15 663 big', 'AVE 720 ']);  // the one after it can be the AVE
  assert.equal(reg.light, 663);
});

test('a day past the timetable borrows one of its kind and says it is approximate', () => {
  const s = train(at('2026-10-20', '10:00', HOME));
  assert.equal(s.note, 'Horari aproximat: avui encara no hi ha horari oficial.');
  assert.equal(s.rows[0].dep, 603);
});

test('no direct train from França to Girona: the board names the stations that have one', () => {
  const s = at('2026-10-01', '10:00', { ...HOME, town: GIRONA, station: FRANCA });
  assert.equal(s.kind, 'none');
  assert.equal(s.label, 'Des de França no hi ha tren directe a Girona. Surt de Sants o de Passeig de Gràcia.');
  assert.equal(s.say, s.label);
  assert.equal(s.knob, 600);
  assert.equal(s.valuetext, 'sense tren directe avui ni demà');
  const back = at('2026-10-01', '10:00', { ...BACK, town: GIRONA, station: FRANCA });
  assert.equal(back.label, 'De Girona no hi ha tren directe a França. Va a Sants o a Passeig de Gràcia.');
});

test('a screen reader hears the train once: the key holds while the countdown runs, and moves with the train', () => {
  const a = at('2026-10-01', '09:58', HOME), b = at('2026-10-01', '10:00', HOME), c = at('2026-10-01', '10:02', HOME);
  assert.equal(a.key, b.key);
  assert.notEqual(b.key, c.key);                             // 10:03 is gone two minutes before it leaves
  assert.notEqual(at('2026-10-01', '10:00', BACK).key, b.key);
  assert.notEqual(at('2026-10-01', '10:00', { ...HOME, station: '71802' }).key, b.key);
});

test('what the sheet says of the line follows the notices: pending, a notice, none, unknown', () => {
  const news = (line: () => unknown, read: string | null) => train(shown({ date: '2026-10-01', min: 600 }, HOME, { line: line as never, read: () => read })).trip.news;
  assert.deepEqual(news(() => undefined, null), { kind: 'pending', line: 'R15' });
  assert.deepEqual(news(() => ({ estat: 'avis', text: 'Per carretera', publicat: null }), '2026-10-01T08:00:00Z'),
    { kind: 'avis', line: 'R15', text: 'Per carretera', read: '2026-10-01T08:00:00Z' });
  assert.deepEqual(news(() => ({ estat: 'normal' }), '2026-10-01T08:00:00Z'), { kind: 'normal', line: 'R15', read: '2026-10-01T08:00:00Z' });
  assert.deepEqual(news(() => ({ estat: 'error' }), null), { kind: 'error', line: 'R15' });
});
