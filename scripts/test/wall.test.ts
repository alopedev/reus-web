// the carriage's wall (src/wall.ts) covers the whole screen but the window, whatever its shape: a hole the wall's
// triangulation loses leaves a black patch on the wall (seen on a phone held sideways, 07-11). `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShapeGeometry } from 'three';
import { wallShape } from '../../src/wall.ts';

function area(A: number, win: { x: number; y: number; z: number; w: number }, r: number){
  const g = new ShapeGeometry(wallShape(A, win, r), 24), p = g.attributes.position.array, idx = g.index!.array;
  let a = 0;
  for(let i = 0; i < idx.length; i += 3){
    const u = idx[i]*3, v = idx[i+1]*3, w = idx[i+2]*3;
    a += Math.abs((p[v] - p[u])*(p[w+1] - p[u+1]) - (p[w] - p[u])*(p[v+1] - p[u+1]))/2;
  }
  return a;
}
// the windows world.ts measures: a desktop, a phone upright, a phone held sideways, a tablet; and their corner radius
const cases: [string, number, { x: number; y: number; z: number; w: number }, number][] = [
  ['1440 × 900', 1440/900, { x: .32, y: .40, z: .68, w: .78 }, .04],
  ['390 × 844', 390/844, { x: .06, y: .48, z: .94, w: .80 }, .03],
  ['844 × 390', 844/390, { x: .0199, y: .0323, z: .4998, w: .9677 }, 24.5/390],
  ['1000 × 1300', 1000/1300, { x: .04, y: .45, z: .96, w: .85 }, .03],
];
for(const [name, A, win, r] of cases) test(`the wall covers all but the window, ${name}`, () => {
  const want = (A + .3)*1.3 - (win.z - win.x)*A*(win.w - win.y);
  assert.ok(Math.abs(area(A, win, r) - want) < .01, `${area(A, win, r)} of ${want}`);
});
