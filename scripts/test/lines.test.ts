// the line pills (src/towns.ts): their letters read against their colour at WCAG AA, 4.5:1 (11-10, option 2 of three:
// R13 and R15 a shade darker, R17 keeps Rodalies' orange with ink letters). `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LINE, lineStyle } from '../../src/towns.ts';

// WCAG 2.1 relative luminance and contrast ratio (w3.org/TR/WCAG21/#dfn-contrast-ratio)
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const parts = (style: string) => Object.fromEntries(style.split(';').filter(Boolean).map(d => d.split(':')));

test('every line pill reads at 4.5:1 or more', () => {
  for(const line of Object.keys(LINE)){
    const s = parts(lineStyle(line));
    assert.ok(ratio(s['--c'], s['--t']) >= 4.5, `${line}: ${s['--t']} on ${s['--c']} is ${ratio(s['--c'], s['--t']).toFixed(2)}:1`);
  }
});
test('R17 keeps Rodalies’ orange, in ink', () => {
  assert.deepEqual(parts(lineStyle('R17')), { '--c': '#F39700', '--t': '#2D241C' });
});
test('a line the site does not know takes the ink colour with paper letters', () => {
  assert.deepEqual(parts(lineStyle('AVE')), { '--c': 'var(--shadow)', '--t': '#FFFFFF' });
});
