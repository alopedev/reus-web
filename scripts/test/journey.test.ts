// the wagons the route draws (src/journey.ts): `npm test`, no browser. check.py keeps where they stand on screen
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { journey, wagonLine } from '../../src/journey.ts';

const STOPS: [string, number][] = [['71500', 640], ['71600', 660]];
// every wagon in the html: its classes and where it stands
const wagons = (html: string) => [...html.matchAll(/<span class="(vago[^"]*)" style="left:([\d.]+)%"/g)].map(m => `${m[1]} ${m[2]}`);

test('no wagon while nothing is on its way', () => {
  assert.deepEqual(wagons(journey(STOPS, 600, 700)), []);
});

test('the train shown on its way: its own wagon, solid, where the timetable puts it', () => {
  assert.deepEqual(wagons(journey(STOPS, 600, 700, .4)), ['vago 40.00']);
  assert.deepEqual(wagons(wagonLine(.4, null)), ['vago 40.00']);
});

// Àlex 10-10, option B of three («me preocupa» that the other wagon reads as yours): yours waits at its departure,
// solid, and the one on its way is a ghost; yours goes last, on top of the ghost when they meet
test('the train shown still to leave: its wagon parked at the departure, the one on its way a ghost', () => {
  assert.deepEqual(wagons(journey(STOPS, 600, 700, null, .63)), ['vago altre 63.00', 'vago parat 0.00']);
  assert.deepEqual(wagons(wagonLine(null, .5)), ['vago altre 50.00', 'vago parat 0.00']);
});
