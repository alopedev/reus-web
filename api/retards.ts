// the live delays (10-10, Àlex: «retard en directe»): Renfe publishes where its Cercanías trains are and how late they
// run, Rodalies de Catalunya included, in two GTFS-RT feeds refreshed every 20 s (CC BY 4.0), but without CORS, so the
// page cannot read them itself. This function reads both and answers, per train number, how late a running regional
// is. The only place that knows the URLs
const LINES = ['R11', 'R13', 'R14', 'R15', 'R16', 'R17'];
const TRIPS = 'https://gtfsrt.renfe.com/trip_updates.json', VEHICLES = 'https://gtfsrt.renfe.com/vehicle_positions.json';

// retard: minutes late (below zero, early); parada: the next stop's stop_id; andana: the platform, when Renfe gives it
export type Train = { estat: 'circula', retard: number, parada: string, andana?: string } | { estat: 'cancelat' };
export interface Answer { llegit: string, trens: Record<string, Train> }

interface Feed { header?: { timestamp?: string }, entity?: Entity[] }
interface Entity {
  vehicle?: { trip?: { tripId?: string }, vehicle?: { label?: string } },
  tripUpdate?: { trip?: { tripId?: string, scheduleRelationship?: string }, stopTimeUpdate?: { stopId?: string }[], delay?: number },
}

// the update carries a tripId that is not always the train number (5181S30503R15 is the 17505); the position carries
// both, its label being «R15-17505»
export function read(trips: Feed, vehicles: Feed): Answer {
  const number = new Map<string, { n: string, andana?: string }>();
  for(const e of vehicles.entity ?? []){
    const id = e.vehicle?.trip?.tripId, m = e.vehicle?.vehicle?.label?.match(/^(R\d+)-(\d+)(?:-PLATF\.\((\w+)\))?/);
    if(id && m && LINES.includes(m[1])) number.set(id, { n: m[2], ...(m[3] ? { andana: m[3] } : {}) });
  }
  const trens: Record<string, Train> = {};
  for(const e of trips.entity ?? []){
    const u = e.tripUpdate, v = number.get(u?.trip?.tripId ?? '');
    if(!u || !v) continue;
    if(u.trip?.scheduleRelationship === 'CANCELED'){ trens[v.n] = { estat: 'cancelat' }; continue; }
    trens[v.n] = { estat: 'circula', retard: Math.round((u.delay ?? 0) / 60), parada: u.stopTimeUpdate?.[0]?.stopId ?? '',
      ...(v.andana ? { andana: v.andana } : {}) };
  }
  // the feeds say when Renfe wrote them: the answer is as old as the older one
  const at = Math.min(...[trips, vehicles].map(f => Number(f.header?.timestamp) * 1000));
  return { llegit: new Date(isNaN(at) ? 0 : at).toISOString(), trens };
}

const WAIT = 5000;
async function feed(url: string): Promise<Feed | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(WAIT) });
    return res.ok ? await res.json() as Feed : null;
  } catch { return null; }
}

export default {
  async fetch(): Promise<Response> {
    const [trips, vehicles] = await Promise.all([feed(TRIPS), feed(VEHICLES)]);
    // a feed that cannot be read: a 502, which the CDN does not keep, so the next visitor asks again. The page then
    // knows nothing of any train, which is not the same as a train not running yet
    if(!trips || !vehicles) return new Response(JSON.stringify({ error: 'renfe' }), { status: 502, headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    return new Response(JSON.stringify(read(trips, vehicles)), { headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0',   // the browser always asks; the CDN answers from its copy
      // Renfe rewrites its feeds every 20 s: however many visitors come, it is asked at most that often per region
      'Vercel-CDN-Cache-Control': 's-maxage=20, stale-while-revalidate=20' } });
  },
};
