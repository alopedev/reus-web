// red.json carries every fast train between Barcelona and a Catalan station (AVE, Avant, Alvia, Euromed, Intercity:
// line AV; the AVE keeps AVE until the web shows them all, scripts/extract_red.py fast_p). Until Àlex picks how they
// look, the web sees what it saw before: only the AVE between Sants and Camp de Tarragona
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asBefore, type Network } from '../../src/time.ts';
import red from '../../data/red.json';

const SANTS = '71801', CAMP = '04104', LLEIDA = '78400', GIRONA = '79300', VILAFANT = '04307', REUS = '71400';
const net = (): Network => ({
  fuente: 'Origen de los datos: Renfe Operadora', actualizado: '2026-11-08',
  estaciones: {
    [SANTS]: { nombre: 'Barcelona-Sants', barcelona: true, lineas: ['AV', 'AVE', 'R15'] },
    [CAMP]: { nombre: 'Camp de Tarragona', lineas: ['AVE'] },
    [LLEIDA]: { nombre: 'Lleida-Pirineus', comarca: 'Segrià', lineas: ['AV', 'AVE', 'R13'], ll: [41.62, 0.634] },
    [GIRONA]: { nombre: 'Girona', comarca: 'Gironès', lineas: ['AV', 'R11'] },
    [VILAFANT]: { nombre: 'Figueres-Vilafant', comarca: 'Alt Empordà', lineas: ['AV'] },
    [REUS]: { nombre: 'Reus', comarca: 'Baix Camp', lineas: ['R15'] },
  },
  trenes: [
    { n: '15123', p: 'R15', s: [[SANTS, 393, 393], [REUS, 483, 483]] },
    { n: '03062', p: 'AVE', s: [[SANTS, 350, 350], [CAMP, 382, 384], [LLEIDA, 411, 413]] },
    { n: '34609', p: 'AV', s: [[SANTS, 400, 400], [GIRONA, 443, 443], [VILAFANT, 458, 458]] },
    { n: '01071', p: 'AV', s: [[SANTS, 435, 435], [CAMP, 470, 470]] },
    { n: '03092', p: 'AVE', s: [[VILAFANT, 473, 473], [GIRONA, 487, 489], [SANTS, 540, 540]] },
  ],
  dias: { '2026-11-10': [0, 1, 2, 3, 4], '2026-11-11': [2, 4] },
});

test('only the AVE between Sants and Camp de Tarragona, as before, with the regionals as they are', () => {
  const n = asBefore(net());
  assert.deepEqual(n.trenes, [
    { n: '15123', p: 'R15', s: [[SANTS, 393, 393], [REUS, 483, 483]] },
    { n: '03062', p: 'AVE', s: [[SANTS, 350, 350], [CAMP, 382, 384]] },
  ]);
  assert.deepEqual(n.dias, { '2026-11-10': [0, 1], '2026-11-11': [] });
});

test('stations only fast trains reach are not there, and no station lists a line it no longer has', () => {
  const e = asBefore(net()).estaciones;
  assert.equal(e[VILAFANT], undefined);
  assert.equal(e[GIRONA], undefined);
  assert.deepEqual(e[SANTS], { nombre: 'Barcelona-Sants', barcelona: true, lineas: ['AVE', 'R15'] });
  assert.deepEqual(e[CAMP], { nombre: 'Camp de Tarragona', lineas: ['AVE'] });
  assert.deepEqual(e[REUS], { nombre: 'Reus', comarca: 'Baix Camp', lineas: ['R15'] });
});

test('a timetable without the new fast trains goes through unchanged', () => {
  const frozen = red as unknown as Network;
  assert.deepEqual(asBefore(structuredClone(frozen)), frozen);
});
