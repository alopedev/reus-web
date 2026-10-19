// the stub «Compra» (src/talons.ts; option A3, Àlex 18-10): what the highlighted time leads to, out where it is seen
// so that nobody has to guess it is behind it; it opens Renfe's search for its trip and day. Telling home lives in the
// train's sheet only since 19-10 (fewer pieces, mockup 1). `npm test`, no browser: check.py keeps the look
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shown, type Shown } from '../../src/shown.ts';
import { talons } from '../../src/talons.ts';
import type { ViewState } from '../../src/state.ts';

const REUS = '71400', SANTS = '71801';
const HOME: ViewState = { dir: 'casa', useNow: true, minute: null, day: null, ave: false, town: REUS, station: SANTS };
const quiet = { line: () => undefined, read: () => null };
const at = (date: string, hm: string, v: ViewState) => { const [h, m] = hm.split(':').map(Number); return shown({ date, min: h * 60 + m }, v, quiet); };
const train = (s: Shown) => { assert.equal(s.kind, 'train'); return s as Extract<Shown, { kind: 'train' }>; };
const hrefs = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
const words = (html: string) => html.replace(/<span class="sr">.*?<\/span>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('one stub buys the highlighted train at Renfe, in a new tab', () => {
  const s = at('2026-10-01', '10:00', HOME), html = talons(s);
  assert.deepEqual(hrefs(html), [train(s).buy]);
  assert.equal(words(html), 'Compra');
  assert.match(html, /target="_blank"/);
});

// a departed train has nothing to buy (shown leaves `buy` empty, 12-10): no stub at all
test('a departed train shown has no stub to buy', () => {
  const gone = at('2026-10-01', '10:00', { ...HOME, useNow: false, minute: 543 });
  assert.equal(train(gone).buy, '');
  assert.equal(talons(gone), '');
});
