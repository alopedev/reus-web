// what the tear-off pad of «Avui · Demà» prints in dots (src/dots.ts): the month on its cardboard, the weekday on each
// sheet, as the ticket's machine prints its date. `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dotText, padMonth, weekday } from '../../src/dots.ts';

test('the weekday of a sheet, in capitals without accents as the machine prints them', () => {
  assert.equal(weekday('2026-10-15'), 'DIJOUS');
  assert.equal(weekday('2026-10-16'), 'DIVENDRES');
  assert.equal(weekday('2026-10-18'), 'DIUMENGE');
});
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
