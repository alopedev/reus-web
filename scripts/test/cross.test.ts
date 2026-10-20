// the two ends of the ticket cross over when the arrows turn the trip around (src/cross.ts; option B «De papel», Àlex
// 20-10): each slides from where it was to its new place on a low arc, one over and one under, so the two names never
// run through each other. `npm test`, no browser: check.py sees it run on the page
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossing } from '../../src/cross.ts';

const at = (k: Keyframe[], i: number) => String(k[i].transform);
const xy = (t: string) => (t.match(/-?[\d.]+/g) ?? []).map(Number);

test('an end starts where it was and lands in its new place', () => {
  const k = crossing({x: 300, y: 40}, {x: 100, y: 40});
  assert.deepEqual(xy(at(k, 0)), [200, 0]);
  assert.equal(at(k, k.length - 1), 'none');
});

test('the end moving right goes over, the one moving left goes under', () => {
  const right = crossing({x: 100, y: 40}, {x: 300, y: 40}), left = crossing({x: 300, y: 40}, {x: 100, y: 40});
  const [, upR] = xy(at(right, 1)), [, upL] = xy(at(left, 1));
  assert.ok(upR < 0 && upL > 0, `right ${upR}, left ${upL}`);
  assert.equal(right[1].offset, .5);
});

test('on two lines the arc still rides on the way down or up', () => {
  const k = crossing({x: 100, y: 0}, {x: 40, y: 30});
  const [x0, y0] = xy(at(k, 0)), [x1, y1] = xy(at(k, 1));
  assert.deepEqual([x0, y0], [60, -30]);
  assert.equal(x1, 30);
  assert.ok(y1 > -15, `the middle at ${y1}, below the straight line's -15`);
});
