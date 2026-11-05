// a train that runs part of its way by bus (works on the line: from 02-11-2026, Lleida ↔ La Plana-Picamoixons on the
// R13 and R14; red.json's `b`, scripts/extract_red.py with_bus). Option A of three (Àlex, 05-11): it is drawn on the
// trip's line on a desktop, and on a phone the board says «bus + tren» and the train's sheet draws and says it.
// The frozen timetable has no bus: these tests give one to a train of it, the R15 15032 from Reus at 10:36 on 01-10,
// as if it ran by bus to Tarragona (71500) and by train from there
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { NET } from '../../src/time.ts';
import { shown, type Shown } from '../../src/shown.ts';
import { board } from '../../src/board.ts';
import { busSheet } from '../../src/journey.ts';
import type { ViewState } from '../../src/state.ts';

const REUS = '71400', SANTS = '71801', TARRAGONA = '71500';
const BACK: ViewState = { dir: 'bcn', useNow: true, minute: null, day: null, ave: false, town: REUS, station: SANTS };
const quiet = { line: () => undefined, read: () => null };
const train = NET.trenes.find(t => t.n === '15032' && t.s[0][0] === '71211')!;
train.b = ['71300', TARRAGONA];
after(() => { delete train.b; });
const at = (hm: string, v: ViewState = BACK) => {
  const [h, m] = hm.split(':').map(Number), s = shown({ date: '2026-10-01', min: h * 60 + m }, v, quiet);
  assert.equal(s.kind, 'train'); return s as Extract<Shown, { kind: 'train' }>;
};

test('a trip that starts by bus: where it changes to the train, when the bus arrives and when the train leaves', () => {
  const v = at('10:32');
  assert.equal(v.rows[0].dep, 636);
  assert.deepEqual(v.bus, { first: true, stop: TARRAGONA, arrives: 654, leaves: 656 });
});

test('a trip only on the train part has no bus', () => {
  // boarding where the bus gives way to the train, the trip is all by train
  const v = at('10:32', { ...BACK, town: TARRAGONA, useNow: false, minute: 656 });
  assert.equal(v.rows[0].dep, 656);
  assert.equal(v.bus, null);
});

test('on a phone, the board says «bus + tren» where it would say nothing, and a screen reader hears it', () => {
  const [row] = board(at('10:32'), false, true);
  assert.match(row, /<span class="gris">bus \+ tren<\/span>/);
  // stacked under the countdown, as a delay is: a countdown of hours would otherwise wrap round it
  assert.match(row, /<span class="w dos">/);
  assert.match(row, /aria-label="R15 de les 10:36, surt en 4 min, arriba a les 12:07, en autobús fins a Tarragona\./);
});

// the labels of a desktop's line, in the order they are written
const labels = (row: string) => [...row.matchAll(/<span class="c (?:up|down)"[^>]*>([^<]*)<\/span>/g)].map(m => m[1]);

test('on a desktop, the trip’s line is dashed by bus up to the change, and says where and when it changes', () => {
  const [row] = board(at('10:32'), false, false);
  assert.match(row, /<span class="rec bus" aria-hidden="true"/);
  // the change stands where the bus arrives: 18 min into a trip of 91
  assert.match(row, /<span class="carretera" style="left:0\.00%;width:19\.78%"><\/span>/);
  assert.match(row, /<i style="left:19\.78%"><\/i>/);
  assert.deepEqual(labels(row), ['en autobús', 'Tarragona', 'canvi al tren, 10:56', 'en tren']);
  // the stops on the way are not named: the line tells the bus and the train apart
  assert.doesNotMatch(row, /class="s"/);
});

test('on its way, a trip by bus has no wagon on its line', () => {
  const [row] = board(at('10:40', { ...BACK, useNow: false, minute: 636 }), false, false);
  assert.doesNotMatch(row, /vago/);
});

test('a trip that ends by bus: the train first, then the change to the bus, on a desktop and on a phone', () => {
  // as if the same train ran by bus from Sant Vicenç de Calders (71600, 11:19, the bus at 11:20) to França
  train.b = ['71600', '79400'];
  try {
    const v = at('10:32');
    assert.deepEqual(v.bus, { first: false, stop: '71600', arrives: 679, leaves: 680 });
    assert.deepEqual(labels(board(v, false, false)[0]), ['en tren', 'Sant Vicenç', 'canvi a l’autobús, 11:20', 'en autobús']);
    const [row] = board(v, false, true);
    assert.match(row, /<span class="gris">tren \+ bus<\/span>/);
    assert.match(row, /, en autobús des de Sant Vicenç de Calders\./);
  } finally { train.b = ['71300', TARRAGONA]; }
});

test('a screen reader hears the bus with the train', () => {
  assert.match(at('10:32').say, /arriba a les 12:07\. En autobús fins a Tarragona\.$/);
});

test('the train’s sheet on a phone draws the bus and the train, and says where and when it changes', () => {
  const t = at('10:32').trip;
  assert.equal(t.bus?.words, 'En autobús fins a Tarragona (arriba a les 10:54). Allà, el tren de les 10:56.');
  const html = busSheet(t.bus!);
  assert.deepEqual([...html.matchAll(/<span class="n[^"]*"[^>]*>([^<]*)<\/span>/g)].map(m => m[1]), ['autobús', 'Tarragona', 'tren']);
  assert.match(html, /<p class="frase">En autobús fins a Tarragona \(arriba a les 10:54\)\. Allà, el tren de les 10:56\.<\/p>/);
  train.b = ['71600', '79400'];
  try {
    assert.equal(at('10:32').trip.bus?.words, 'En tren fins a Sant Vicenç de Calders (arriba a les 11:19). Allà, l’autobús de les 11:20.');
  } finally { train.b = ['71300', TARRAGONA]; }
  assert.equal(at('10:32', { ...BACK, town: TARRAGONA, useNow: false, minute: 656 }).trip.bus, null);
});
