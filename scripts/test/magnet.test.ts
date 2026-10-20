// let go halfway through the turn to the table and the page finishes it in the direction you were going (option 2,
// Àlex 20-10): a nudge at either end is not a turn, and the page goes back. `npm test`, no browser: check.py keeps
// the real gestures
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settle } from '../../src/magnet.ts';

test('going down past the first nudge: on to the table', () => {
  assert.equal(settle(.35, 1), 1);
  assert.equal(settle(.15, 1), 1);
  assert.equal(settle(.9, 1), 1);
});

test('going up past the first nudge: back to the hero', () => {
  assert.equal(settle(.65, -1), 0);
  assert.equal(settle(.85, -1), 0);
  assert.equal(settle(.1, -1), 0);
});

test('a nudge from the hero or from the table goes back where it was', () => {
  assert.equal(settle(.05, 1), 0);
  assert.equal(settle(.95, -1), 1);
});

test('at either end, it stays', () => {
  assert.equal(settle(0, 1), 0);
  assert.equal(settle(1, -1), 1);
  assert.equal(settle(0, -1), 0);
  assert.equal(settle(1, 1), 1);
});

test('with no direction yet, the nearer end', () => {
  assert.equal(settle(.4, 0), 0);
  assert.equal(settle(.6, 0), 1);
});
