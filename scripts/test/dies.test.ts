// «Dia» (22-11, option A of three): the calendar sheet that «dia» opens, two weeks (or so) from Monday to Sunday, one
// button per day with a timetable (src/dies.ts). Against the frozen timetable (28-09 to 11-10). `npm test`, no browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendar, pad } from '../../src/dies.ts';

const TODAY = '2026-10-01';   // a Thursday; the frozen timetable ends on Sunday 11-10
const days = (missing: string[] = []) => ['02', '03', '04', '05', '06', '07', '08', '09', '10', '11'].map(d => ({ day: `2026-10-${d}`, trains: !missing.includes(`2026-10-${d}`) }));
const buttons = (html: string) => [...html.matchAll(/<button[^>]*data-day="([^"]+)"[^>]*>/g)].map(m => m[1]);

test('Monday to Sunday: the days before today left blank, today and every day with a timetable a button', () => {
  const html = calendar(TODAY, days(), null);
  assert.equal((html.match(/class="dd buit"/g) ?? []).length, 3);   // 28, 29 and 30 of September
  assert.deepEqual(buttons(html), ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
  assert.match(html, /aria-label="Avui, dijous 1 d’octubre"/);
  assert.match(html, /aria-label="Demà, divendres 2 d’octubre"/);
  assert.match(html, /<b>2<\/b><small>demà<\/small>/);
  assert.match(html, /Encara no hi ha horaris després de l’11 d’octubre\./);
});

test('the day looked at is stamped; a day with no direct train is struck through and cannot be pressed', () => {
  const html = calendar(TODAY, days(['2026-10-04']), '2026-10-06');
  assert.match(html, /<button[^>]*data-day="2026-10-06"[^>]*aria-current="true"/);
  assert.equal((html.match(/aria-current/g) ?? []).length, 1);
  assert.ok(!buttons(html).includes('2026-10-04'));
  assert.match(html, /<button type="button" class="dd no" disabled aria-label="Diumenge 4 d’octubre, sense tren directe"><b>4<\/b>/);
});

test('a week that runs past the timetable ends with its days struck through, and a new month is named on its first day', () => {
  const html = calendar('2026-11-22', [...Array(12)].map((_, i) => { const d = new Date(Date.UTC(2026, 10, 23 + i, 12)); return { day: d.toISOString().slice(0, 10), trains: true }; }), null);
  // 22-11 is a Sunday: six blanks before it, and the timetable ends on Friday 04-12, so Saturday 5 and Sunday 6 are struck
  assert.equal((html.match(/class="dd buit"/g) ?? []).length, 6);
  assert.match(html, /aria-label="Dissabte 5 de desembre, sense horari"><b>5<\/b>/);
  assert.match(html, /<b>1<\/b><small>des\.<\/small>/);
  assert.match(html, /després del 4 de desembre\./);
});

// «Un altre dia» (22-11 evening, Àlex: the words, and drawing C of three): the pad over the ruler, two sheets hanging
// from its cardboard. Before a day is chosen the second sheet says «un altre dia» over a tiny wall calendar in colour
// (the pad's own cardboard, two staples and a day in red), the same world as the pad above; once chosen, its number
const sheet = (html: string, key: string) => html.match(new RegExp(`<button[^>]*data-dia="${key}"[\\s\\S]*?</button>`))![0];
test('«un altre dia» with a tiny wall calendar, then the day chosen', () => {
  const html = pad('2026-09-28', 'avui', '2026-09-28');
  const s = sheet(html, 'dia');
  assert.match(s, /<i>un altre dia<\/i>/);
  assert.match(s, /aria-label="Un altre dia"/);
  assert.match(s, /aria-haspopup="dialog"/);
  assert.match(s, /<svg class="cal"[^>]*aria-hidden="true"/);
  assert.match(s, /fill="#6E4232"/);   // the cardboard of the pad
  assert.match(s, /fill="#C8432B"/);   // a day in red
  assert.match(sheet(html, 'avui'), /<i>avui<\/i> <b>28<\/b>/);
  assert.match(sheet(html, 'avui'), /aria-pressed="true"/);
  const chosen = sheet(pad('2026-09-28', 'dia', '2026-10-01'), 'dia');
  assert.match(chosen, /<i>un altre dia<\/i> <b>1<\/b>/);
  assert.match(chosen, /aria-label="Dijous, 1 d’octubre\. Tria un altre dia"/);
  assert.match(chosen, /aria-pressed="true"/);
  assert.doesNotMatch(chosen, /<svg class="cal"/);
});
