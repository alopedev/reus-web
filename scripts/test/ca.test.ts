// how the site writes Catalan around names and dates (src/ca.ts). `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateSpan } from '../../src/ca.ts';

// the back of the ticket says which days the timetable covers: «Horaris de l’11 al 24 d’octubre del 2026»
test('a timetable within one month: the month and the year once, «l’» before 1 and 11', () => {
  assert.equal(dateSpan('2026-10-11', '2026-10-24'), 'de l’11 al 24 d’octubre del 2026');
  assert.equal(dateSpan('2026-10-01', '2026-10-14'), 'de l’1 al 14 d’octubre del 2026');
  assert.equal(dateSpan('2026-10-04', '2026-10-17'), 'del 4 al 17 d’octubre del 2026');
});
test('across two months: each day with its month, the year once', () => {
  assert.equal(dateSpan('2026-09-28', '2026-10-11'), 'del 28 de setembre a l’11 d’octubre del 2026');
  assert.equal(dateSpan('2026-10-20', '2026-11-02'), 'del 20 d’octubre al 2 de novembre del 2026');
});
test('across the new year: each date in full', () => {
  assert.equal(dateSpan('2026-12-25', '2027-01-07'), 'del 25 de desembre del 2026 al 7 de gener del 2027');
});
