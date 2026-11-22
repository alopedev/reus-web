// what the tear-off pad of «Avui · Demà» prints in dots (src/dots.ts): the month on its cardboard, as the ticket's
// machine prints its date. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dotText, padMonth } from '../../src/dots.ts';

test('the cardboard says the month of both sheets, and both months when they differ', () => {
  assert.equal(padMonth('2026-10-15', '2026-10-16'), 'OCTUBRE 2026');
  assert.equal(padMonth('2026-10-31', '2026-11-01'), 'OCT · NOV 2026');
  assert.equal(padMonth('2026-12-31', '2027-01-01'), 'DES 26 · GEN 27');
  assert.equal(padMonth('2027-03-01', '2027-03-02'), 'MARÇ 2027');
  assert.equal(padMonth('2027-06-01', '2027-06-02'), 'JUNY 2027');
});
test('any of those words is drawn in dots, one 5×7 cell and a gap per letter', () => {
  for(const w of ['DIJOUS', 'DISSABTE', 'MARÇ 2027', 'JUNY 2027', 'OCT · NOV 2026']){
    const svg = dotText(w);
    assert.match(svg, new RegExp(`viewBox="0 0 ${w.length * 6 - 1} 7"`), w);
    assert.ok((svg.match(/<circle/g) ?? []).length > w.replace(/ /g, '').length * 5, `${w} has too few dots`);
  }
});

// the stubs of the desktop print their train like the ticket's machine (Àlex 22-11, option A): «R15 · 11:03» needs a colon
test('the machine prints a time with its colon', () => {
  const svg = dotText('R15 · 11:03');
  assert.match(svg, /viewBox="0 0 65 7"/);
  const colon = dotText(':');
  assert.equal((colon.match(/<circle/g) ?? []).length, 8);   // two 2×2 dots, one above the other
});

// on the phone the ticket's date is the button that opens the calendar (Àlex 22-11, B): a calendar leaf, read face on,
// with the month on its red band and the day under it, in the machine's dots
test('the phone prints the day as a calendar leaf: the month on its band and the day, without the year', async () => {
  const { dateLeaf } = await import('../../src/dots.ts');
  const svg = dateLeaf('2026-11-23');
  assert.match(svg, /class="hoja"/);
  assert.match(svg, /data-mes="NOV"/);
  assert.match(svg, /data-dia="23"/);
  assert.doesNotMatch(svg, /-26|2026/);
  assert.match(svg, /aria-hidden="true"/);
  // a day under ten is one figure, as on a wall calendar, and still sits in the middle of the leaf
  const five = dateLeaf('2026-12-05');
  assert.match(five, /data-mes="DES"/);
  assert.match(five, /data-dia="5"/);
  const xs = [...five.matchAll(/<g class="d"[^>]*>(.*?)<\/g>/g)][0][1].match(/cx="([\d.]+)"/g)!.map(s => +s.slice(4, -1));
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  assert.ok(Math.abs(mid - 12) < 1, `the 5 sits at ${mid}, not in the middle (12)`);
});
