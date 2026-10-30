// the live delays (api/retards.ts): what the function makes of Renfe's two real-time feeds, with feeds of the
// test's own. `npm test`, no network
import { test } from 'node:test';
import assert from 'node:assert/strict';
import retards, { read } from '../../api/retards.ts';
import avisos from '../../api/avisos.ts';

const NOW = Date.parse('2026-10-10T15:40:00Z'), S = (t: number) => String(Math.round(t / 1000));
const header = (at = NOW - 20e3) => ({ gtfsRealtimeVersion: '2.0', timestamp: S(at) });
// a running train as the feeds give it: its position (with its label) and its update, joined by tripId
const vehicle = (tripId: string, label: string, stopId = '71503') =>
  ({ id: `VP_${label}`, vehicle: { trip: { tripId }, position: { latitude: 41.1, longitude: 1.2 },
    currentStatus: 'IN_TRANSIT_TO', timestamp: S(NOW), stopId, vehicle: { id: label.split('-')[1], label } } });
const update = (tripId: string, delay: number, stopId = '71503') =>
  ({ id: `TUUPDATE_${tripId}`, tripUpdate: { trip: { tripId, scheduleRelationship: 'SCHEDULED' },
    stopTimeUpdate: [{ arrival: { delay, time: S(NOW + 300e3) }, stopId }], vehicle: { wheelchairAccessible: 'WHEELCHAIR_INACCESSIBLE' }, delay } });
const feeds = (updates: object[], vehicles: object[]) =>
  [{ header: header(), entity: updates }, { header: header(), entity: vehicles }] as const;

test('a running regional: its delay in whole minutes, under its train number, though the tripId carries another', () => {
  const [trips, vehicles] = feeds([update('5181S30503R15', 1500)], [vehicle('5181S30503R15', 'R15-17505')]);
  const a = read(trips, vehicles);
  assert.deepEqual(a.trens['17505'], { estat: 'circula', retard: 25, parada: '71503' });
});

test('only the regionals Capacasa shows: R11 and R13 to R17, not the R4 nor a Madrid C5', () => {
  const [trips, vehicles] = feeds(
    [update('5181S15918R11', 120), update('5181S77644R4', 60), update('1081S12345C5', 60)],
    [vehicle('5181S15918R11', 'R11-15918'), vehicle('5181S77644R4', 'R4-77644'), vehicle('1081S12345C5', 'C5-12345')]);
  assert.deepEqual(Object.keys(read(trips, vehicles).trens), ['15918']);
});

test('a train running early says so: a delay below zero', () => {
  const [trips, vehicles] = feeds([update('5181S15874R11', -120)], [vehicle('5181S15874R11', 'R11-15874')]);
  assert.equal(read(trips, vehicles).trens['15874']?.retard, -2);
});

test('the platform, when the label carries it', () => {
  const [trips, vehicles] = feeds([update('5181S17050R15', 0), update('5181S15035R15', 0)],
    [vehicle('5181S17050R15', 'R15-17050-PLATF.(13)'), vehicle('5181S15035R15', 'R15-15035')]);
  const { trens } = read(trips, vehicles);
  assert.equal(trens['17050']?.andana, '13');
  assert.equal('andana' in trens['15035']!, false);
});

test('read at the time of the older feed, so the page can tell an old answer', () => {
  const trips = { header: header(NOW - 20e3), entity: [] }, vehicles = { header: header(NOW - 90e3), entity: [] };
  assert.equal(read(trips, vehicles).llegit, new Date(NOW - 90e3).toISOString());
});

test('a cancelled train is cancelled, never on time; without its position its number is not known, so nothing', () => {
  const cancel = (tripId: string) => ({ id: `TUCANCEL_${tripId}`, tripUpdate: { trip: { tripId, scheduleRelationship: 'CANCELED' } } });
  const [trips, vehicles] = feeds([cancel('5181S30503R15'), cancel('5181S16001R15')], [vehicle('5181S30503R15', 'R15-17505')]);
  assert.deepEqual(read(trips, vehicles).trens, { '17505': { estat: 'cancelat' } });
});

// the function as Vercel runs it, with Renfe answered by the test: `answers` says, per URL, how each ask goes
async function invoke(fn: { fetch(): Promise<Response> }, answers: (url: string, n: number) => Response | Error){
  const real = globalThis.fetch, asked = new Map<string, number>();
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input), n = (asked.get(url) ?? 0) + 1;
    asked.set(url, n);
    const a = answers(url, n);
    if(a instanceof Error) throw a;
    return a;
  }) as typeof fetch;
  try { return { res: await fn.fetch(), asked }; } finally { globalThis.fetch = real; }
}
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

test('Renfe cutting a connection once is asked again: the page still gets its delays, not a 502', async () => {
  const [trips, vehicles] = feeds([update('5181S30503R15', 1500)], [vehicle('5181S30503R15', 'R15-17505')]);
  const { res, asked } = await invoke(retards, (url, n) => url.includes('vehicle') ? (n === 1 ? new TypeError('fetch failed') : json(vehicles)) : json(trips));
  assert.equal(res.status, 200);
  assert.equal(((await res.json()) as { trens: Record<string, unknown> }).trens['17505'] !== undefined, true);
  assert.equal(asked.get('https://gtfsrt.renfe.com/vehicle_positions.json'), 2);
});

test('Renfe down: still a 502, after asking twice and no more', async () => {
  const { res, asked } = await invoke(retards, () => new TypeError('fetch failed'));
  assert.equal(res.status, 502);
  assert.deepEqual([...asked.values()], [2, 2]);
});

// while Renfe or the Generalitat fail, the CDN goes on giving its last good answer for a while instead of the error;
// the page already drops an answer older than it can trust (3 min the delays, 30 min the notices)
const staleIfError = (res: Response) => Number(/stale-if-error=(\d+)/.exec(res.headers.get('Vercel-CDN-Cache-Control') ?? '')?.[1] ?? 0);

test('the CDN keeps the last delays for 2 minutes when Renfe fails', async () => {
  const [trips, vehicles] = feeds([], []);
  const { res } = await invoke(retards, url => json(url.includes('vehicle') ? vehicles : trips));
  assert.equal(staleIfError(res), 120);
});

test('the CDN keeps the last notices for 10 minutes when the Generalitat fails', async () => {
  const { res } = await invoke(avisos, () => new Response('<rss><channel></channel></rss>'));
  assert.equal(staleIfError(res), 600);
});
