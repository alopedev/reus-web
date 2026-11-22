// a hole in a Rodalies town's trains (22-11-2026): Renfe's feed had no Rodalies trains on the weekdays from 30-11 to
// 04-12 while red.json had those days, so Mataró's board said there was no train and the calendar struck the week
// out. A day the town's file lacks borrows the latest known day of the same kind (weekday, Saturday, Sunday), as the
// rest of the timetable already does, and the board says the timetable is approximate. A file of its own: the network
// is the module's state, and rodalies.test.ts fills it with Mataró's whole file
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { split } from '../../src/split.ts';
import { NET, addPart, direct, dayData, SANTS, REUS, type Network } from '../../src/time.ts';

const rod = JSON.parse(readFileSync('scripts/baseline/rodalies.json', 'utf8')) as Network;
const MATARO = '79500';
const HOLE = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];   // Monday to Friday
const whole = split(rod).towns[MATARO];
const holed = { t: whole.t, dias: Object.fromEntries(Object.entries(whole.dias).filter(([d]) => !HOLE.includes(d))) };
const times = (iso: string) => direct(iso, SANTS, MATARO).map(t => t[0]);

test('a day missing from a town\'s file borrows its latest weekday, and says it is approximate', () => {
  addPart(holed, MATARO);
  assert.ok(times('2026-10-02').length > 20, 'Friday 02-10 has its trains');
  for(const day of HOLE){
    assert.deepEqual(times(day), times('2026-10-02'), day);
    assert.equal(dayData(day, MATARO).exact, false, day);
  }
});

test('the days the file has stay exact, each train once, and other towns are not approximate', () => {
  assert.equal(dayData('2026-10-02', MATARO).exact, true);
  assert.equal(dayData('2026-10-10', MATARO).exact, true);
  assert.equal(dayData('2026-10-06', REUS).exact, true);
  for(const [day, ids] of Object.entries(NET.dias)) assert.equal(new Set(ids).size, ids.length, day);
  addPart(holed, MATARO);
  assert.deepEqual(times('2026-10-06'), times('2026-10-02'), 'twice changes nothing');
});
