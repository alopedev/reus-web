// where the carriage built in 3D puts its seats, its camera and its lamp (src/carriage.ts, used by src/room.ts):
// on a wide screen a bay of two seats either side of the window; on a phone our seat alone, close up, in profile at
// the window's lower-left corner, cut by the screen's bottom edge below its armrest (Àlex, 07-11). `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, ARMREST } from '../../src/carriage.ts';

// a desktop's window (1440 × 900) and a phone's (390 × 844), as world.ts measures them: fractions of the screen, y up
const A = 1440/900, desk = { x: .32, y: .40, z: .68, w: .78 };
const a = 390/844, phone = { x: .091, y: .346, z: .909, w: .706 };
const near = (x: number, y: number) => Math.abs(x - y) < 1e-9;

test('on a wide screen, two seats either side of the window, face to face, standing on the floor', () => {
  const p = plan(A, desk, true);
  const m = (desk.w - desk.y)/.75, cx = (desk.x + desk.z)/2*A;
  assert.equal(p.seats.length, 4);
  for(const s of p.seats){ assert.ok(near(s.scale, m)); assert.ok(near(s.y0, desk.y - .9*m)); }
  const xs = p.seats.map(s => s.x - cx).sort((u, v) => u - v);
  assert.ok(near(xs[0], -xs[3]) && near(xs[1], -xs[2]), 'symmetric about the window');
  // the two in front of the window face it: the left one faces right, the right one left; each has a grab handle
  const front = p.seats.filter(s => s.handle);
  assert.deepEqual(front.map(s => [Math.sign(s.x - cx), s.dir]).sort(), [[-1, 1], [1, -1]]);
  assert.equal(p.lamp, null);
  assert.deepEqual(p.eye, [A/2, .5, 1.7]);
});

test('on a phone, our seat alone, close up at the left edge, its armrest at a quarter of the screen', () => {
  const p = plan(a, phone, false);
  const ours = p.seats.filter(s => s.handle);
  assert.equal(ours.length, 1);
  const s = ours[0];
  assert.equal(s.dir, 1, 'facing the window, seen in profile');
  assert.ok(Math.abs(s.x - .07) < .001, 'its back just right of the window\'s left edge');
  assert.ok(near(s.scale, .6), 'a fixed size on the screen, whatever the window measures');
  assert.ok(near(s.y0 + ARMREST*s.scale, .25), 'the armrest a quarter up the screen: the bottom edge cuts below it');
  assert.ok(s.y0 < 0, 'its base off the screen');
  // only the back of the next bay's seat behind it, back to back, partly off the left edge
  const back = p.seats.filter(t => !t.handle);
  assert.equal(back.length, 1);
  assert.equal(back[0].dir, -1);
  assert.ok(back[0].x < s.x);
  assert.deepEqual(p.eye, [a/2, .5, 1.7], 'the same straight-on view as a desktop');
});

test('on a phone, a lamp over our seat (lit only at night, see room.ts); none on a wide screen', () => {
  const p = plan(a, phone, false);
  assert.ok(p.lamp);
  assert.ok(p.lamp![0] < phone.x*a + .1, 'over our seat, at the window\'s left');
  assert.equal(plan(A, desk, true).lamp, null);
});

test('on a screen with no room at the sides but a window away from its edge, our seat stands at the window\'s corner', () => {
  // 900 × 900: a desktop's window in the middle, too close to the edges for a bay of seats
  const win = { x: .2, y: .388, z: .8, w: .758 }, p = plan(1, win, false), s = p.seats.find(t => t.handle)!;
  assert.ok(Math.abs(s.x - win.x*1 - (.07 - phone.x*a)) < .001, 'as far from the window\'s left edge as on a phone');
  assert.ok(s.y0 + (ARMREST + .3)*s.scale > win.y, 'its back rises over the window\'s bottom edge');
});

test('a phone\'s seat stays where it is when the window grows (taller at night with fewer rows)', () => {
  const tall = { ...phone, y: .40 };
  const s0 = plan(a, phone, false).seats.find(s => s.handle)!, s1 = plan(a, tall, false).seats.find(s => s.handle)!;
  assert.deepEqual([s1.x, s1.y0, s1.scale], [s0.x, s0.y0, s0.scale]);
});

// the luggage rack over the window, seen from the camera (eye at height .5, 1.7 in front): it and its luggage are
// either whole on the screen or left out, never cut by the top edge (a phone held sideways has no room for it)
const seen = (y: number, z: number) => .5 + (y - .5)*1.7/(1.7 - z);
test('the rack and its luggage are drawn only where they fit whole under the screen\'s top edge', () => {
  const sideways = { x: .03, y: .035, z: .5, w: .965 };
  const cases: [number, typeof desk, boolean][] = [[A, desk, true], [a, phone, false], [667/375, sideways, false], [1000/1300, { x: .04, y: .45, z: .96, w: .85 }, false], [768/1024, { x: .05, y: .47, z: .95, w: .82 }, false]];
  for(const [AA, win, wide] of cases){
    const p = plan(AA, win, wide);
    if(p.rack === null) continue;
    assert.ok(p.rack > win.w, 'over the window');
    assert.ok(seen(p.rack, .36*p.m) < .99, 'its front rail on the screen');
    if(p.luggage) assert.ok(seen(p.rack + .19*p.m, .31*p.m) < .99, 'the case\'s top on the screen');
  }
  assert.ok(plan(A, desk, true).rack !== null && plan(A, desk, true).luggage, 'a desktop has both');
  assert.equal(plan(667/375, sideways, false).rack, null, 'a phone held sideways has none');
});
