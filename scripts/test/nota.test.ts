import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fit } from '../../src/nota.ts';

// on a phone the line under the highlighted time is one line, always (25-11, Àlex's video): written in two lines, or
// empty, it made the window grow and shrink as the finger slid along the ruler. What does not fit leaves, least needed
// first: «sense dades», then the countdown, then the bus; where a fast train arrives when it is not the town, never

test('everything stays when it fits', () => {
  assert.deepEqual(fit([60, 180], [2, 0], 20, 300), [0, 1]);
});

test('«sense dades» leaves first, then the countdown; the other station never', () => {
  // «en 3 min» · «baixa a Camp de Tarragona» · «sense dades»
  const w = [60, 190, 80], p = [2, 0, 3], sep = 15;
  assert.deepEqual(fit(w, p, sep, 280), [0, 1]);       // 60 + 15 + 190 = 265
  assert.deepEqual(fit(w, p, sep, 240), [1]);          // the countdown too
  assert.deepEqual(fit(w, p, sep, 150), [1]);          // and nothing else, even if it does not fit
});

test('the bus stays over the countdown', () => {
  // «en 3 min» · «bus + tren» · «sense dades»
  assert.deepEqual(fit([60, 90, 80], [2, 1, 3], 15, 160), [1]);
  assert.deepEqual(fit([60, 90, 80], [2, 1, 3], 15, 165), [0, 1]);
});
