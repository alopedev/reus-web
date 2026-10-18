// how each trip of the board reads (src/board.ts), against the frozen timetable (scripts/baseline/red.json): the words
// of a row and what a screen reader hears of it, on a desktop and on a phone. `npm test`, no browser: check.py keeps
// the look. A row is read as check.py reads the page: tags dropped, «compra’l ↗» and the route left out, spaces collapsed
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shown, type Shown } from '../../src/shown.ts';
import { board } from '../../src/board.ts';
import type { ViewState } from '../../src/state.ts';
import type { Known } from '../../src/retards.ts';

const REUS = '71400', SANTS = '71801';
const HOME: ViewState = { dir: 'casa', useNow: true, minute: null, day: null, ave: false, town: REUS, station: SANTS };
const quiet = { line: () => undefined, read: () => null };
const at = (date: string, hm: string, v: ViewState) => {
  const [h, m] = hm.split(':').map(Number), s = shown({ date, min: h * 60 + m }, v, quiet);
  assert.equal(s.kind, 'train'); return s as Extract<Shown, { kind: 'train' }>;
};
const read = (html: string) => html.replace(/<a class="buy".*?<\/a>/g, '').replace(/<span class="rec[^]*?<\/span><\/span>(?=<\/span>)/, '')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
const desk = (v: ViewState, date: string, hm: string) => board(at(date, hm, v), v.dir === 'casa', false).map(read);

test('a weekday morning, Sants → Reus: the next regional with its countdown, then the one after it', () => {
  assert.deepEqual(desk(HOME, '2026-10-01', '10:00'), ['R15 10:03 el pròxim, en 3 min → 11:33', 'R15 11:03 després → 12:33']);
});

const BACK: ViewState = { ...HOME, dir: 'bcn' };
test('Reus → Sants at night: today’s last AVE from Camp de Tarragona, then tomorrow’s first regional, «demà»', () => {
  assert.deepEqual(desk(BACK, '2026-10-01', '21:30'), ['AVE 22:17 el pròxim, en 47 min → 22:59 des de Camp de Tarragona', 'R15 05:36 demà → 07:07']);
});

// on a phone every trip is a button: its times, the countdown on the train shown, «demà» where it applies, and a «›»;
// what a screen reader hears is the whole trip and that it opens its detail
const label = (html: string) => html.match(/aria-label="([^"]*)"/)?.[1];
test('on a phone the board keeps the times, and each trip says itself in full to a screen reader', () => {
  const rows = board(at('2026-10-01', '10:00', HOME), true, true);
  assert.deepEqual(rows.map(read), ['R15 10:03 en 3 min → 11:33 ›', 'R15 11:03 → 12:33 ›']);
  assert.deepEqual(rows.map(label), ['R15 de les 10:03, surt en 3 min, arriba a les 11:33. Veure el detall i comprar',
    'R15 de les 11:03, arriba a les 12:33. Veure el detall i comprar']);
  const night = board(at('2026-10-01', '21:30', BACK), false, true);
  assert.deepEqual(night.map(read), ['AVE 22:17 en 47 min → 22:59 ›', 'R15 05:36 demà → 07:07 ›']);
  assert.deepEqual(night.map(label), ['AVE de les 22:17 des de Camp de Tarragona, surt en 47 min, arriba a les 22:59. Veure el detall i comprar',
    'R15 de les 05:36, demà, arriba a les 07:07. Veure el detall i comprar']);
});

test('on a desktop the time shown buys it at Renfe, and the other trip is a button that names itself', () => {
  const [big, next] = board(at('2026-10-01', '10:00', HOME), true, false);
  assert.equal(label(big), '10:03, comprar a Renfe (s’obre en una altra pestanya)');
  assert.equal(label(next), 'R15 de les 11:03, arriba a les 12:33');
  assert.equal(label(board(at('2026-10-01', '21:30', BACK), false, false)[0]), '22:17, comprar a Renfe (s’obre en una altra pestanya)');
});

// the live delay of the train shown (Renfe's feed): a fake of what the page knows of each train. At 10:00 on 01-10 the
// train shown from Sants is the R15 15005, 10:03 → 11:33
const live = (k: Known) => ({ train: (n: string) => n === '15005' ? k : undefined });
const atLive = (k: Known, phone: boolean) => board(shown({ date: '2026-10-01', min: 600 }, HOME, quiet, live(k)) as Extract<Shown, { kind: 'train' }>, true, phone);

test('a late train: its time struck, the new one beside it with the countdown to it, and its arrival corrected', () => {
  const late: Known = { estat: 'circula', retard: 25, parada: '71802' };
  assert.equal(read(atLive(late, false)[0]), 'R15 10:03 10:28 +25 min, en 28 min → 11:33 11:58');
  assert.match(atLive(late, false)[0], /<s>11:33<\/s>/);
  assert.equal(read(atLive(late, true)[0]), 'R15 10:03 10:28 en 28 min → 11:58 ›');
  assert.equal(label(atLive(late, true)[0]), 'R15 de les 10:03, amb 25 min de retard, surt cap a les 10:28 i arriba a les 11:58. Veure el detall i comprar');
});

test('a cancelled train: struck and «cancel·lat», no countdown', () => {
  assert.equal(read(atLive({ estat: 'cancelat' }, false)[0]), 'R15 10:03 cancel·lat → 11:33');
  assert.equal(read(atLive({ estat: 'cancelat' }, true)[0]), 'R15 10:03 cancel·lat → 11:33 ›');
  assert.equal(label(atLive({ estat: 'cancelat' }, true)[0]), 'R15 de les 10:03, cancel·lat. Veure el detall i comprar');
});

test('no live data yet: said in full on a desktop, in two words on a phone, never as «on time»', () => {
  for(const k of [{ estat: 'sense' }, { estat: 'error' }] as Known[]){
    assert.equal(read(atLive(k, false)[0]), 'R15 10:03 el pròxim, en 3 min · sense dades en directe encara → 11:33');
    assert.equal(read(atLive(k, true)[0]), 'R15 10:03 en 3 min sense dades → 11:33 ›');
  }
});

test('on time, the row is the same as with no delay at all', () => {
  assert.deepEqual(atLive({ estat: 'circula', retard: 1, parada: '71802' }, false), board(at('2026-10-01', '10:00', HOME), true, false));
});

const GIRONA = '79300', TARRAGONA = '71500', PDG = '71802';
test('other towns and stations: the R11 to and from Girona, the AVE to Camp de Tarragona, from Passeig de Gràcia', () => {
  const girona = { ...HOME, town: GIRONA };
  assert.deepEqual(desk(girona, '2026-09-28', '10:00'), ['R11 10:16 el pròxim, en 16 min → 11:35', 'R11 11:16 després → 12:47']);
  assert.equal(at('2026-09-28', '10:00', girona).ruler.length, 23);   // the day's direct R11 trains, Sants → Girona
  assert.deepEqual(desk({ ...girona, dir: 'bcn' }, '2026-09-28', '10:00'), ['R11 10:19 el pròxim, en 19 min → 11:40', 'R11 11:09 després → 12:40']);
  assert.deepEqual(desk({ ...HOME, town: TARRAGONA }, '2026-09-28', '10:00'), ['R15 10:03 el pròxim, en 3 min → 11:12', 'R17 10:33 després → 11:42']);
  assert.deepEqual(desk({ ...HOME, town: TARRAGONA }, '2026-09-28', '11:50'), ['AVE 12:00 el pròxim, en 10 min → 12:31 fins a Camp de Tarragona', 'R14 12:03 després → 13:12']);
  assert.deepEqual(desk({ ...HOME, station: PDG }, '2026-09-28', '10:00'), ['R15 10:56 el pròxim, en 56 min → 12:33', 'R14 11:56 després → 13:33']);
});

test('a train picked that has already left says so where the next one would say «el pròxim»', () => {
  assert.deepEqual(desk({ ...HOME, useNow: false, minute: 543 }, '2026-10-01', '10:00'), ['R15 09:03 ja ha sortit → 10:33', 'AVE 09:55 després → 10:26 fins a Camp de Tarragona']);
});

// Renfe opens the day's list, not the train (src/buy.ts): a cancelled or departed train shown has nothing to buy, so
// its time does not link to Renfe (12-10, option A of three); the phone's sheet loses «Compra a Renfe». The word
// «compra’l ↗» left the row for the stub by the pad (talons.ts, A3, Àlex 18-10)
const links = (html: string) => (html.match(/href="https:\/\/venta\.renfe\.com[^"]*"/g) ?? []).length;
test('the train shown links to Renfe by its time; cancelled or already gone, not at all', () => {
  const [big] = board(at('2026-10-01', '10:00', HOME), true, false);
  assert.equal(links(big), 1);
  assert.doesNotMatch(big, /compra’l/);
  for(const row of [atLive({ estat: 'cancelat' }, false)[0], board(at('2026-10-01', '10:00', { ...HOME, useNow: false, minute: 543 }), true, false)[0]]){
    assert.equal(links(row), 0);
    assert.doesNotMatch(row, /compra’l/);
    assert.match(row, /id="dep"/);
  }
});
test('a cancelled or departed train shown has no Renfe link for the phone’s sheet', () => {
  assert.notEqual(at('2026-10-01', '10:00', HOME).trip.buy, '');
  assert.equal((shown({ date: '2026-10-01', min: 600 }, HOME, quiet, live({ estat: 'cancelat' })) as Extract<Shown, { kind: 'train' }>).trip.buy, '');
  assert.equal(at('2026-10-01', '10:00', { ...HOME, useNow: false, minute: 543 }).trip.buy, '');
});

test('tomorrow looked at («Demà»): the train shown says «demà» where today’s would say «el pròxim», the next one «després»', () => {
  const v: ViewState = { ...HOME, useNow: false, minute: 603, day: '2026-10-02' };
  assert.deepEqual(desk(v, '2026-10-01', '10:00'), ['R15 10:03 demà → 11:33', 'R15 11:03 després → 12:33']);
});
