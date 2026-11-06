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
  const s = at('2026-10-01', '10:00', HOME), html = talons(s, false);
  assert.deepEqual(hrefs(html), [train(s).buy]);
  assert.equal(words(html), 'Compra');
  assert.match(html, /target="_blank"/);
});

// a departed train has nothing to buy (shown leaves `buy` empty, 12-10): no stub at all
test('a departed train shown has no stub to buy', () => {
  const gone = at('2026-10-01', '10:00', { ...HOME, useNow: false, minute: 543 });
  assert.equal(train(gone).buy, '');
  assert.equal(talons(gone, false), '');
});

// «Recorda» (04-11, Àlex: option A): on a desktop, a second stub by «Compra» puts the train in the visitor's calendar
// with an alarm 15 min before (src/calendar.ts); on a phone the header has room for one, so it lives in the sheet
test('on a desktop a second stub, «Recorda», saves the train to the calendar; on a phone only «Compra»', () => {
  const s = train(at('2026-10-01', '09:30', HOME)), html = talons(s, false);
  assert.equal(words(html), 'Compra Recorda');
  assert.deepEqual(hrefs(html), [s.buy, s.remind]);
  assert.match(html, /class="talo recorda" href="[^"]*" download/);   // a file to open, the page stays
});

// on a phone the header's stub is the way into the train's sheet (05-11, Àlex: B, «El tren», with the word «Aquest», 06-11 «Agafa’l»):
// the time is not seen to be pressed, the stub is, and the sheet holds buying, telling home and reminding. A button,
// not a link: it goes nowhere, it opens the sheet
test('on a phone the stub says «Agafa’l», with a wagon, and is a button that opens the train\'s sheet', () => {
  const html = talons(train(at('2026-10-01', '09:30', HOME)), true);
  assert.equal(words(html), 'Agafa’l');
  assert.deepEqual(hrefs(html), []);
  assert.match(html, /^<button type="button" class="talo agafa"/);
  assert.match(html, /<i><svg viewBox="0 0 30 18"/);   // the wagon, drawn behind the dotted line
});

// the sheet is there for every train, gone or cancelled too (it says so, with its delay and the line's notice)
test('on a phone even a departed train has its «Agafa’l»', () => {
  const gone = at('2026-10-01', '10:00', { ...HOME, useNow: false, minute: 543 });
  assert.equal(words(talons(gone, true)), 'Agafa’l');
});

test('a train leaving in under 15 min can be bought but not reminded', () => {
  const s = at('2026-10-01', '10:00', HOME);
  assert.equal(words(talons(s, false)), 'Compra');
});

// the train's sheet on a phone (src/detail.ts) has the same ways out as buttons: «Compra a Renfe», «Avisar a casa»
// and, last, «Recorda-m’ho» (the mockup's order)
import { actions } from '../../src/talons.ts';

test('the sheet\'s buttons: buy, tell home and remind (opened by the phone\'s calendar, not downloaded)', () => {
  const s = train(at('2026-10-01', '09:30', HOME)), html = actions(s.trip);
  assert.equal(words(html), 'Compra a Renfe ↗ Avisar a casa Recorda-m’ho');
  assert.equal(hrefs(html)[2], s.remind);
  assert.doesNotMatch(html, /class="recorda"[^>]*download/);
});

test('in the sheet too, no «Recorda-m’ho» for a train leaving in under 15 min, and no «Compra» for one gone', () => {
  assert.equal(words(actions(train(at('2026-10-01', '10:00', HOME)).trip)), 'Compra a Renfe ↗ Avisar a casa');
  assert.equal(words(actions(train(at('2026-10-01', '10:00', { ...HOME, useNow: false, minute: 543 })).trip)), 'Avisar a casa');
});
