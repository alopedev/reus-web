// the scene's light on the papers of a phone's hero (fewer pieces, mockup 1, Àlex 19-10): the ticket and the card of
// the highlighted time take the colour of the light that comes in through the window, from its side, and a shade that
// deepens at night. `npm test`, no browser: check.py keeps the look
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daylight, paperLight } from '../../src/light.ts';

// the gradient's angle, its light at the start and the shade at its end
const read = (css: string) => {
  const m = css.match(/^linear-gradient\((\d+)deg, rgba\((\d+),(\d+),(\d+),([\d.]+)\), [^,]+,[^,]+,[^,]+,[^)]+\) 45%, rgba\(\d+,\d+,\d+,([\d.]+)\)\)$/);
  assert.ok(m, `not a light: ${css}`);
  return { deg: +m[1], rgb: [+m[2], +m[3], +m[4]], light: +m[5], shade: +m[6] };
};
const DAY = '2026-10-18';

test('in the evening the paper takes the low sun’s warm light, from the other side than in the morning', () => {
  const dusk = read(paperLight(daylight(18 * 60 + 50, DAY))), noon = read(paperLight(daylight(12 * 60, DAY)));
  assert.equal(daylight(18 * 60 + 50, DAY).name, 'dusk');
  assert.ok(dusk.rgb[0] > dusk.rgb[2] + 60, `a dusk light that is not warm: ${dusk.rgb}`);
  assert.notEqual(Math.sign(dusk.deg - 180), Math.sign(noon.deg - 180), 'the light comes from the same side at noon and at dusk');
});

test('at night the light on the paper is faint and the shade deeper than by day', () => {
  const night = read(paperLight(daylight(23 * 60, DAY))), noon = read(paperLight(daylight(12 * 60, DAY)));
  assert.ok(night.light < noon.light, `night ${night.light}, noon ${noon.light}`);
  assert.ok(night.shade > noon.shade, `night shade ${night.shade}, noon ${noon.shade}`);
});
