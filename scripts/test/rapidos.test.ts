// every fast train (AVE, Avant, Alvia, Euromed, Intercity) between Barcelona and a Catalan station, under one pill,
// «AV» (Àlex, 08-11): no mark of any kind, mixed with the regionals by the hour, each visitor picks what suits them.
// Where it calls at another station than the town's own, the board says so as it said for the AVE (Àlex, 08-11: «Sí,
// como hoy con el AVE»): Camp de Tarragona for Baix Camp and Tarragonès, Figueres-Vilafant for Figueres
// The frozen timetable has only the AVE of Camp de Tarragona: these tests give it two fast trains of 08-11's feed,
// the Avant 34609 to Girona and Figueres-Vilafant and the AVE 03092 back, on 01-10
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NET, dayData } from '../../src/time.ts';
import { shown, type Shown } from '../../src/shown.ts';
import { board } from '../../src/board.ts';
import type { ViewState } from '../../src/state.ts';

const SANTS = '71801', GIRONA = '79300', FIGUERES = '79309', VILAFANT = '04307', REUS = '71400', DAY = '2026-10-01';
NET.estaciones[VILAFANT] = { nombre: 'Figueres-Vilafant', comarca: 'Alt Empordà', lineas: ['AV'] };
const out = NET.trenes.push({ n: '34609', p: 'AV', s: [[SANTS, 400, 400], [GIRONA, 443, 443], [VILAFANT, 458, 458]] }) - 1;
const back = NET.trenes.push({ n: '03092', p: 'AV', s: [[VILAFANT, 473, 473], [GIRONA, 487, 489], [SANTS, 540, 540]] }) - 1;
NET.dias[DAY].push(out, back);

const quiet = { line: () => undefined, read: () => null };
const view = (town: string, dir: 'casa' | 'bcn', minute: number, ave: boolean): ViewState =>
  ({ dir, useNow: false, minute, day: null, ave, town, station: SANTS });
const at = (v: ViewState) => {
  const s = shown({ date: DAY, min: 360 }, v, quiet);
  assert.equal(s.kind, 'train'); return s as Extract<Shown, { kind: 'train' }>;
};
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

test('a fast train that calls at your town is one more direct train, mixed with the regionals by the hour', () => {
  const { r, b, ar } = dayData(DAY, GIRONA).d;
  assert.deepEqual(r.find(t => t[2] === '34609'), [400, 443, '34609', 'AV']);
  assert.deepEqual(b.find(t => t[2] === '03092'), [489, 540, '03092', 'AV']);
  assert.deepEqual(r.map(t => t[0]), [...r.map(t => t[0])].sort((x, y) => x - y));
  assert.deepEqual(ar, []);   // Girona's own station: nothing elsewhere
});

test('its row is a plain row with the «AV» pill, no other station, and no notices for its line', () => {
  const s = at(view(GIRONA, 'casa', 400, false));
  assert.equal(text(board(s, true, false)[0]).startsWith('AV 06:40'), true);
  assert.doesNotMatch(board(s, true, false)[0], /fins a/);
  assert.equal(s.trip.ave, '');
  assert.equal(s.trip.news.kind, 'ave');                 // Renfe gives no notices for the fast trains
  assert.equal(s.lines.includes('AV'), false);           // and the stamp only reads the regional lines
  assert.match(s.remind, /l=AV/);
});

test('Figueres: the fast trains call at Figueres-Vilafant, and the board says so as it does for Camp de Tarragona', () => {
  const { ar, ab, r } = dayData(DAY, FIGUERES).d;
  assert.deepEqual(ar.map(t => t[2]), ['34609']);
  assert.deepEqual(ab.map(t => t[2]), ['03092']);
  assert.equal(r.some(t => t[3] === 'AV'), false);
  const s = at(view(FIGUERES, 'casa', 400, true));
  const row = text(board(s, true, false)[0]);   // with its route on a desktop: Girona, between Sants and Vilafant
  assert.equal(row.startsWith('AV 06:40 el pròxim'), true, row);
  assert.equal(row.endsWith('→ 07:38 fins a Figueres-Vilafant'), true, row);
  assert.equal(s.trip.ave, 'Aquest tren no arriba a Figueres: baixa a Figueres-Vilafant.');
  const home = at(view(FIGUERES, 'bcn', 473, true));
  assert.equal(home.trip.ave, 'Aquest tren no surt de Figueres: surt de Figueres-Vilafant.');
  assert.equal(home.trip.from, 'Figueres-Vilafant');
});

test('Reus keeps Camp de Tarragona, now under the «AV» pill', () => {
  const s = at(view(REUS, 'bcn', 1337, true));
  assert.equal(text(board(s, false, false)[0]), 'AV 22:17 el pròxim → 22:59 des de Camp de Tarragona');
  assert.equal(s.trip.ave, 'Aquest tren no surt de Reus: surt de Camp de Tarragona.');
});

test('Figueres-Vilafant is not a town of the chooser, and no group is made of fast trains', async () => {
  const { GROUPS } = await import('../../src/towns.ts');
  const towns = GROUPS.flatMap(g => g.towns.map(t => t.id));
  assert.equal(towns.includes(VILAFANT), false);
  assert.equal(towns.includes(GIRONA), true);
  assert.equal(GROUPS.some(g => g.lines.includes('AV')), false);
  assert.equal(GROUPS.flatMap(g => g.towns).find(t => t.id === GIRONA)!.line, 'R11');
});
