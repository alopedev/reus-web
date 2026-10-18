// the stubs by the pad (src/talons.ts; option A3, Àlex 18-10): the two actions of the highlighted time, out on the
// wall so that nobody has to guess they are behind it. «Compra ↗» opens Renfe's search for its trip and day;
// «Avisa a casa», only on a phone, opens WhatsApp with the train written. `npm test`, no browser: check.py keeps the look
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

test('on a desktop, one stub buys the highlighted train at Renfe, in a new tab', () => {
  const s = at('2026-10-01', '10:00', HOME), html = talons(s, false);
  assert.deepEqual(hrefs(html), [train(s).buy]);
  assert.equal(words(html), 'Compra ↗');
  assert.match(html, /target="_blank"/);
});

test('on a phone, a second stub tells home by WhatsApp, with the train already written', () => {
  const s = at('2026-10-01', '10:00', HOME), html = talons(s, true);
  assert.deepEqual(hrefs(html), [train(s).buy, 'https://wa.me/?text=' + encodeURIComponent('Agafo l’R15 de les 10:03 a Sants. Arribo a Reus a les 11:33.')]);
  assert.equal(words(html), 'Compra ↗ Avisa a casa');
});

// a departed train has nothing to buy (shown leaves `buy` empty, 12-10): no «Compra»; on a phone home can still be told
test('a departed train shown has no stub to buy; on a phone «Avisa a casa» stays', () => {
  const gone = at('2026-10-01', '10:00', { ...HOME, useNow: false, minute: 543 });
  assert.equal(train(gone).buy, '');
  assert.equal(talons(gone, false), '');
  assert.equal(words(talons(gone, true)), 'Avisa a casa');
});
