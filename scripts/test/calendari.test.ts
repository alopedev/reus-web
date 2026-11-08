// «Recorda» (04-11, Àlex: option A): the train shown, into the visitor's own calendar with an alarm 15 min before it
// leaves. api/calendari.ts writes the iCalendar file (iPhone, Mac, Outlook); src/calendar.ts the link, which on
// Android goes to Google Calendar instead. `npm test`, no network
import { test } from 'node:test';
import assert from 'node:assert/strict';
import calendari, { ics } from '../../api/calendari.ts';

const R15 = { d: '2026-11-06', s: 1053, a: 1143, l: 'R15', o: 'Sants', x: 'Reus' };   // Friday 17:33 → 19:03
const field = (text: string, name: string) => text.split('\r\n').find(l => l.startsWith(name + ':'))?.slice(name.length + 1);

test('the train as a calendar event: its times in UTC (Madrid is UTC+1 in November), its trip and an alarm 15 min before', () => {
  const text = ics(R15);
  assert.equal(field(text, 'DTSTART'), '20261106T163300Z');
  assert.equal(field(text, 'DTEND'), '20261106T180300Z');
  assert.equal(field(text, 'SUMMARY'), 'R15 Sants → Reus');
  assert.equal(field(text, 'TRIGGER'), '-PT15M');
  assert.match(text, /^BEGIN:VCALENDAR\r\n/);
  assert.match(text, /END:VCALENDAR\r\n$/);
});

const ask = (q: Record<string, string | number>) =>
  calendari.fetch(new Request('https://capacasa.alope.dev/api/calendari?' + new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)]))));

test('the function answers the train as a file the phone opens as an event to add', async () => {
  const res = await ask(R15);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type') ?? '', /^text\/calendar; charset=utf-8$/);
  assert.match(res.headers.get('Content-Disposition') ?? '', /^inline; filename="[\w-]+\.ics"$/);
  const text = await res.text();
  assert.equal(field(text, 'DTSTART'), '20261106T163300Z');
  assert.equal(field(text, 'LOCATION'), 'Sants');
});

test('a train not shaped like one is a 400, never an event: the address is anyone\'s to write', async () => {
  for(const bad of [{}, { ...R15, d: '6-11-2026' }, { ...R15, s: 'x' }, { ...R15, a: 1000 }, { ...R15, s: 3000, a: 3100 },
    { ...R15, l: 'R2' }, { ...R15, o: '' }, { ...R15, x: 'a'.repeat(61) }, { ...R15, o: 'Sants\r\nATTACH:http://x' }]){
    const res = await ask(bad);
    assert.equal(res.status, 400, JSON.stringify(bad));
  }
});

test('a fast train (AV) and a train after midnight: DTEND the next day', async () => {
  const text = await (await ask({ d: '2026-11-06', s: 1430, a: 1475, l: 'AV', o: 'Sants', x: 'Camp de Tarragona' })).text();
  assert.equal(field(text, 'DTSTART'), '20261106T225000Z');
  assert.equal(field(text, 'DTEND'), '20261106T233500Z');
  assert.equal(field(text, 'SUMMARY'), 'AV Sants → Camp de Tarragona');
});

test('a page from before the fast trains, still open, writes the AVE: still a train', async () => {
  const res = await ask({ d: '2026-11-06', s: 1430, a: 1475, l: 'AVE', o: 'Sants', x: 'Camp de Tarragona' });
  assert.equal(res.status, 200);
});

// the link, as the page writes it (src/calendar.ts)
import { remindUrl } from '../../src/calendar.ts';

test('on the iPhone, the Mac or a PC the link asks the function for the file; the function reads back the same train', async () => {
  const url = remindUrl(R15, false);
  assert.match(url, /^\/api\/calendari\?/);
  const res = await calendari.fetch(new Request('https://capacasa.alope.dev' + url));
  assert.equal(field(await res.text(), 'DTSTART'), '20261106T163300Z');
});

test('on Android the link opens Google Calendar with the train written, in Madrid time, the next day past midnight', () => {
  const u = new URL(remindUrl({ d: '2026-11-06', s: 1430, a: 1475, l: 'AV', o: 'Sants', x: 'Camp de Tarragona' }, true));
  assert.equal(u.origin + u.pathname, 'https://calendar.google.com/calendar/render');
  assert.equal(u.searchParams.get('action'), 'TEMPLATE');
  assert.equal(u.searchParams.get('text'), 'AV Sants → Camp de Tarragona');
  assert.equal(u.searchParams.get('dates'), '20261106T235000/20261107T003500');
  assert.equal(u.searchParams.get('ctz'), 'Europe/Madrid');
});
