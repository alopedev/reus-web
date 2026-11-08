// the live delays (10-10, Àlex: «retard en directe»): Renfe publishes where its Cercanías trains are and how late they
// run, Rodalies de Catalunya included, in two GTFS-RT feeds refreshed every 20 s (CC BY 4.0), but without CORS, so the
// page cannot read them itself. This function reads both and answers, per train number, how late a running regional
// is. The only place that knows the URLs
// the regionals, and since 08-11 every other Rodalies line (the site serves anyone who lives in Catalonia); the feed
// writes R2 Nord and R2 Sud as «R2N» and «R2S»
const LINES = ['R1', 'R2', 'R2N', 'R2S', 'R3', 'R4', 'R7', 'R8', 'R11', 'R13', 'R14', 'R15', 'R16', 'R17'];
const TRIPS = 'https://gtfsrt.renfe.com/trip_updates.json', VEHICLES = 'https://gtfsrt.renfe.com/vehicle_positions.json';
// the AVE's delays (04-11): Renfe's long-distance feed, the same licence and also without CORS
const LD = 'https://gtfsrt.renfe.com/trip_updates_LD.json';

// retard: minutes late (below zero, early); parada: the next stop's stop_id; andana: the platform, when Renfe gives it
export type Train = { estat: 'circula', retard: number, parada: string, andana?: string } | { estat: 'cancelat' };
// cancelats: the cancelled regionals Renfe gives no position for, by their number in the Rodalies feed (see read);
// ave: the AVE by number (readAve), or null when the long-distance feed could not be read
export interface Answer { llegit: string, trens: Record<string, Train>, cancelats: string[], ave?: Record<string, Train> | null }

interface Feed { header?: { timestamp?: string }, entity?: Entity[] }
interface Entity {
  vehicle?: { trip?: { tripId?: string }, vehicle?: { label?: string } },
  tripUpdate?: { trip?: { tripId?: string, scheduleRelationship?: string }, stopTimeUpdate?: { stopId?: string }[], delay?: number },
}

// the trips of a weekday in the Rodalies feed: «5181S…» is a Saturday's (L M X J V S D, Monday first)
const LETTER = 'DLMXJVS';
const MADRID_DAY = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short' });
const MADRID_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' });
const todayDate = (): string => MADRID_DATE.format(new Date());
const todayLetter = (): string => LETTER[['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(MADRID_DAY.format(new Date()))];

// the update carries a tripId that is not always the train number (5181S30503R15 is the 17505); the position carries
// both, its label being «R15-17505». A cancelled train does not run, so it has no position (02-11: 11 cancelled,
// none with one): its tripId is the Rodalies feed's trip_id, whose middle number is that feed's own (not always the
// train number either), and the page, which has both in red.json, finds the train. Only today's: `day` is the letter
// of today's weekday in Madrid
export function read(trips: Feed, vehicles: Feed, day: string = todayLetter()): Answer {
  const number = new Map<string, { n: string, andana?: string }>();
  for(const e of vehicles.entity ?? []){
    const id = e.vehicle?.trip?.tripId, m = e.vehicle?.vehicle?.label?.match(/^(R\d+[NS]?)-(\d+)(?:-PLATF\.\((\w+)\))?/);
    if(id && m && LINES.includes(m[1])) number.set(id, { n: m[2], ...(m[3] ? { andana: m[3] } : {}) });
  }
  const trens: Record<string, Train> = {}, cancelats: string[] = [];
  for(const e of trips.entity ?? []){
    const u = e.tripUpdate, id = u?.trip?.tripId ?? '', v = number.get(id);
    const cancelled = u?.trip?.scheduleRelationship === 'CANCELED';
    if(u && !v && cancelled){
      const m = id.match(/^\d{4}([A-Z])(\d+)(R\d+[NS]?)$/);
      if(m && m[1] === day && LINES.includes(m[3])) cancelats.push(m[2]);
    }
    if(!u || !v) continue;
    if(cancelled){ trens[v.n] = { estat: 'cancelat' }; continue; }
    trens[v.n] = { estat: 'circula', retard: Math.round((u.delay ?? 0) / 60), parada: u.stopTimeUpdate?.[0]?.stopId ?? '',
      ...(v.andana ? { andana: v.andana } : {}) };
  }
  // the feeds say when Renfe wrote them: the answer is as old as the older one
  const at = Math.min(...[trips, vehicles].map(f => Number(f.header?.timestamp) * 1000));
  return { llegit: new Date(isNaN(at) ? 0 : at).toISOString(), trens, cancelats };
}

// the AVE (04-11, Àlex: option A, as the regionals): its delay comes in Renfe's long-distance feed, whose tripId is
// the train number (five digits, as in red.json: «03073»), one more digit and the day: «0307312026-11-05». Only
// `date`'s trains (today's in Madrid)
export function readAve(ld: Feed, date: string): Record<string, Train> {
  const trens: Record<string, Train> = {};
  for(const e of ld.entity ?? []){
    const u = e.tripUpdate, m = u?.trip?.tripId?.match(/^(\d{5})\d(\d{4}-\d\d-\d\d)$/);
    if(!u || !m || m[2] !== date) continue;
    const had = trens[m[1]];
    if(u.trip?.scheduleRelationship === 'CANCELED'){ if(!had) trens[m[1]] = { estat: 'cancelat' }; continue; }
    // the feed gives a train once per digit after its number, and now and then twice with two delays (04-11, 07:22:
    // the 03062 with +4 and +11 min): the smaller one is kept, so the page never sends anyone too late to catch it;
    // a copy that runs beats a cancelled one
    const t: Train = { estat: 'circula', retard: Math.round((u.delay ?? 0) / 60), parada: u.stopTimeUpdate?.[0]?.stopId ?? '' };
    if(had?.estat !== 'circula' || t.retard < had.retard) trens[m[1]] = t;
  }
  return trens;
}

// Renfe now and then cuts a connection or does not answer (30-10: 5 asks in 80): one more try, both within the 5 s
// a single one had
const WAIT = 2500, TRIES = 2;
async function feed(url: string): Promise<Feed | null> {
  for(let i = 0; i < TRIES; i++){
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(WAIT) });
      if(res.ok) return await res.json() as Feed;
    } catch { /* asked again below */ }
  }
  return null;
}

export default {
  async fetch(): Promise<Response> {
    const [trips, vehicles, ld] = await Promise.all([feed(TRIPS), feed(VEHICLES), feed(LD)]);
    // a feed that cannot be read: a 502, which the CDN does not keep, so the next visitor asks again. The page then
    // knows nothing of any train, which is not the same as a train not running yet
    if(!trips || !vehicles) return new Response(JSON.stringify({ error: 'renfe' }), { status: 502, headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    // the long-distance feed failing says nothing of the regionals: the AVE is then unknown, never «not running»
    const answer: Answer = { ...read(trips, vehicles), ave: ld ? readAve(ld, todayDate()) : null };
    return new Response(JSON.stringify(answer), { headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0',   // the browser always asks; the CDN answers from its copy
      // Renfe rewrites its feeds every 20 s: however many visitors come, it is asked at most that often per region.
      // If Renfe fails, the CDN gives the last answer for 2 more minutes instead of the 502 (the page trusts 3)
      'Vercel-CDN-Cache-Control': 's-maxage=20, stale-while-revalidate=20, stale-if-error=120' } });
  },
};
