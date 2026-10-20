// the landscape's still frame (src/scenery.ts): when the landscape is not moving (reduced motion, paused, or before
// it is painted in), whoever changes what the window shows asks scenery.still() to paint it again, and nobody else
// touches the world for it. `npm test`, with the few browser pieces scenery needs faked here
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { World } from '../../src/world.ts';

const g = globalThis as Record<string, unknown>;
const on: Record<string, (e: unknown) => void> = {};
let reduced = false;
g.matchMedia = () => ({ matches: reduced });
g.addEventListener = (type: string, fn: (e: unknown) => void) => { on[type] = fn; };
g.document = { getElementById: () => ({ classList: { contains: () => false, add() {}, remove() {} }, parentElement: {} }), addEventListener() {}, hidden: false };
g.ResizeObserver = class { observe() {} };
g.location = { search: '' };
g.requestAnimationFrame = () => 1;

const frames: number[][] = [];
const world = { frame: (...a: number[]) => { frames.push(a); }, resize() {} } as unknown as World;

test('still() paints the fixed frame when the landscape is not moving, and does nothing while it moves', async () => {
  reduced = true;
  const { createScenery } = await import('../../src/scenery.ts?reduced');
  const scenery = createScenery(world);
  frames.length = 0;
  scenery.still();
  assert.deepEqual(frames, [[0, 0, 1]]);
  createScenery(null).still();                                     // no WebGL: nothing to paint, and no error
  assert.equal(frames.length, 1);
  // recording (?grabar), P sets it moving even with reduced motion: its own loop paints, a still frame would not do
  g.location = { search: '?grabar' };
  const moving = createScenery(world);
  on.keydown({ key: 'p', target: {} });
  frames.length = 0;
  moving.still();
  assert.deepEqual(frames, []);
});
