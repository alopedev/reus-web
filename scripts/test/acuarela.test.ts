// how long the watercolour takes to paint itself in (src/scenery.ts): 3 s, and the hero's texts come in at three
// quarters of it (Àlex 30-10, opción B «pintar más deprisa»; before, 4.6 s and the texts at 3.45 s, more than half of
// a first visit on a phone with 4G, rendimiento/carga.md). `npm test`, with the browser pieces scenery needs faked
// here and a clock of its own
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { World } from '../../src/world.ts';

const g = globalThis as Record<string, unknown>;
let now = 0, next: ((t: number) => void) | null = null, entered = false;
g.matchMedia = () => ({ matches: false });
g.addEventListener = () => {};
g.document = { getElementById: () => ({ classList: { contains: () => entered, add: () => { entered = true; }, remove: () => { entered = false; } }, parentElement: {} }),
  addEventListener() {}, hidden: false };
g.ResizeObserver = class { observe() {} };
g.location = { search: '' };
Object.defineProperty(g, 'performance', { value: { now: () => now }, configurable: true });
g.requestAnimationFrame = (fn: (t: number) => void) => { next = fn; return 1; };
g.scrollY = 0; g.innerHeight = 800;

const reveals: number[] = [];
const world = { frame: (_dx: number, _t: number, reveal: number) => { reveals.push(reveal); }, resize() {} } as unknown as World;

// runs the landscape's loop at 60 frames a second up to the given second
function until(seconds: number){ while(now < seconds * 1000 && next){ now += 1000 / 60; const f = next; next = null; f(now); } }

test('the watercolour paints itself in 3 s, and the texts come in at three quarters of it', async () => {
  const { createScenery } = await import('../../src/scenery.ts');
  let ins = 0;
  createScenery(world, () => { ins++; }).repaint();
  until(2.2);
  assert.equal(entered, false, 'at 2.2 s the texts are still waiting');
  assert.ok(reveals.at(-1)! < .75);
  until(2.3);
  assert.equal(entered, true, 'at 2.3 s the texts are in');
  assert.equal(ins, 1);
  until(2.95);
  assert.ok(reveals.at(-1)! < 1, 'at 2.95 s the painting is not finished');
  until(3.1);
  assert.equal(reveals.at(-1), 1, 'at 3.1 s the painting is finished');
});
