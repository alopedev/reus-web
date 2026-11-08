// a Rodalies town's trains come when the town is chosen (src/rodalies.ts): asked for once, even when two parts of the
// page ask at once; a failure (no connection) is said, and the next try asks again. With a network of the test's own
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { split } from '../../src/split.ts';
import { createParts } from '../../src/rodalies.ts';
import { direct, SANTS, REUS, type Network } from '../../src/time.ts';

const { towns } = split(JSON.parse(readFileSync('scripts/baseline/rodalies.json', 'utf8')) as Network);
const MATARO = '79500', day = '2026-09-29';

test('a town\'s file is asked for once, and its trains join the board', async () => {
  const asked: string[] = [];
  const parts = createParts(async url => { asked.push(url); return towns[MATARO]; });
  assert.ok(parts.waiting(MATARO));
  const [a, b] = await Promise.all([parts.load(MATARO), parts.load(MATARO)]);
  assert.ok(a && b);
  assert.deepEqual(asked, ['/assets/79500.json']);
  assert.ok(!parts.waiting(MATARO));
  assert.equal(await parts.load(MATARO), false);
  assert.equal(asked.length, 1);
  assert.ok(direct(day, SANTS, MATARO).length > 20);
});

test('a town with no Rodalies file asks for nothing', async () => {
  const parts = createParts(async () => { throw new Error('asked'); });
  assert.ok(!parts.waiting(REUS));
  assert.equal(await parts.load(REUS), false);
});

test('without a connection the town says so, and the next try asks again', async () => {
  let up = false;
  const parts = createParts(async () => { if(!up) throw new Error('offline'); return towns['71700']; });
  assert.equal(await parts.load('71700'), false);
  assert.ok(parts.failed('71700'));
  assert.ok(!parts.waiting('71700'), 'a failed file is not waited for');
  up = true;
  assert.ok(await parts.load('71700'));
  assert.ok(!parts.failed('71700'));
});
