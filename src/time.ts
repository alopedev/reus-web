import red from '../data/red.json';
import index from 'virtual:rodalies';
import type { Part, RodaliesIndex } from './split';

// the network timetable (scripts/extract_red.py, contract in docs/referencias/datos-red-contrato.md): every train
// once, with its stops as [stop_id, arrival, departure], and the trains that run each day
// f: its number in the Rodalies feed, where it differs; b: the part it runs by bus, from one of its stops to a later one
// (works on the line, scripts/extract_red.py with_bus)
export interface NetTrain { n: string; f?: string; p: string; s: [string, number, number][]; b?: [string, string] }
export interface Network {
  fuente: string; actualizado: string;
  estaciones: Record<string, { nombre: string; comarca?: string; lineas?: string[]; barcelona?: boolean; ll?: [lat: number, lon: number] }>;
  trenes: NetTrain[];

  dias: Record<string, number[]>;
}
export const SANTS = '71801', REUS = '71400', CAMP = '04104', VILAFANT = '04307', CATALUNYA = '78805';
// exported so towns.ts can build the chooser's groups from the same parsed network, without reading red.json twice.
// The other Rodalies lines (R1, R2, R2N, R2S, R4…; Àlex 08-11: the site serves anyone who lives in Catalonia) come in
// two parts (split.ts): their stations and stopping patterns with the page, joined here to red.json's, and each
// town's trains when it is chosen (addPart)
const RED = red as unknown as Network;
// `f`: each town's file of trains, by stop_id
const rodalies = index as RodaliesIndex & { f: Record<string, string> };
const stations: Network['estaciones'] = { ...RED.estaciones };
for(const [id, st] of Object.entries(rodalies.estaciones)){
  const was = stations[id];
  stations[id] = was ? { ...was, lineas: [...new Set([...was.lineas ?? [], ...st.lineas ?? []])].sort(), barcelona: was.barcelona || st.barcelona || undefined } : st;
}
export const NET: Network = { ...RED, estaciones: stations };
// one train per stopping pattern of those lines, with no days: what the chooser needs to know their towns and order
export const PATTERNS: NetTrain[] = rodalies.patrons;
// the file with a town's Rodalies trains (rodalies.ts fetches it), by stop_id; none for a town without them
export const RODALIES_FILES: Record<string, string> = rodalies.f;

// a town's Rodalies trains join the network: each train once (two towns share most of theirs), on the days the
// timetable has. True if anything was added
const trainKey = (t: NetTrain): string => t.n + '|' + t.p + '|' + t.s.map(x => x.join('.')).join(',');
let known: Set<string> | null = null;
export function addPart(part: Part): boolean {
  known ??= new Set(NET.trenes.map(trainKey));
  const at = part.t.map(t => { const k = trainKey(t); if(known!.has(k)) return -1; known!.add(k); return NET.trenes.push(t) - 1; });
  for(const [day, ids] of Object.entries(part.dias)){
    const list = NET.dias[day]; if(!list) continue;
    for(const j of ids) if(at[j] >= 0) list.push(at[j]);
  }
  return at.some(i => i >= 0);
}
// the Barcelona end of the trip (3.5): Sants first, the default. El Clot left out (Àlex, 05-10: nobody asks for it)
// `short` is the name on the ticket, where «Passeig de Gràcia» does not fit (Àlex, 06-10); everywhere else, `name`
export const BCN: {id: string, name: string, short: string}[] = [{id:SANTS, name:'Sants', short:'Sants'},
  {id:'71802', name:'Passeig de Gràcia', short:'Gràcia'}, {id:'79400', name:'França', short:'França'},
  // Plaça de Catalunya (Àlex, 08-11, B of three): the R1 and the R4 call neither at Passeig de Gràcia nor at França
  {id:CATALUNYA, name:'Plaça de Catalunya', short:'Catalunya'}];
export const bcnName = (id: string): string => BCN.find(s => s.id === id)?.name ?? 'Sants';
export const bcnShort = (id: string): string => BCN.find(s => s.id === id)?.short ?? 'Sants';
// the fast trains (line AV: AVE, Avant, Alvia, Euromed, Intercity; Àlex, 08-11) are direct trains like any other where
// they call at the town (Girona, Lleida, L'Aldea…). A few towns also have them at another station, a real alternative
// to the regional: Camp de Tarragona for Baix Camp and Tarragonès (about 35 min instead of 1 h 40 min), Figueres-
// Vilafant, 2 km from the R11's, for Figueres. `altOf` names that station, null for every other town
export const FAST = 'AV';
const ALT_COMARCAS = new Set(['Baix Camp', 'Tarragonès']);
const FIGUERES = '79309';
export const altOf = (town: string): string | null =>
  town === FIGUERES ? VILAFANT : ALT_COMARCAS.has(NET.estaciones[town]?.comarca ?? '') ? CAMP : null;
// who the data comes from and when it was updated: Renfe's licence asks for both
export const source = { fuente: NET.fuente, actualizado: NET.actualizado };

// a train: departure and arrival in minutes after midnight, its number and its line (R11…R17, AV)
export type Train = [dep: number, arr: number, id: string, line: string];
// one day's timetable: r Sants → the town, b the town → Sants, regionals and fast trains; ar/ab the fast trains to and
// from the town's other station (altOf: Camp de Tarragona, Figueres-Vilafant), only for the towns that have one
export interface DayTimetable { r: Train[]; b: Train[]; ar: Train[]; ab: Train[] }

// the direct trains of a day from one station to another: the same train stops at `from` and later at `to`
export function direct(iso: string, from: string, to: string): Train[] {
  const out: Train[] = [];
  for(const i of NET.dias[iso] ?? []){
    const t = NET.trenes[i], a = t.s.findIndex(x => x[0]===from), b = t.s.findIndex(x => x[0]===to);
    if(a >= 0 && b > a) out.push([t.s[a][2], t.s[b][1], t.n, t.p]);
  }
  return out.sort((x, y) => x[0]-y[0]);
}

// the stops a direct train makes between two stations, both left out, with the time it reaches each (the trip's
// detail on a phone counts them; the big train's route on a desktop draws them): the first train of the day with
// that number that calls at `from` and later at `to`, as direct() found it (any day's, for a day beyond the
// timetable, which borrows another day's trains)
export function stopsBetween(iso: string, id: string, from: string, to: string): [stop: string, arr: number][] | null {
  const x = trainOf(iso, id, from, to);
  return x && x.t.s.slice(x.a + 1, x.b).map(y => [y[0], y[1]]);
}
function trainOf(iso: string, id: string, from: string, to: string): { t: NetTrain, a: number, b: number } | null {
  for(const i of [...(NET.dias[iso] ?? []), ...NET.trenes.keys()]){
    const t = NET.trenes[i]; if(t.n !== id) continue;
    const a = t.s.findIndex(x => x[0]===from), b = t.s.findIndex(x => x[0]===to);
    if(a >= 0 && b > a) return { t, a, b };
  }
  return null;
}

// the part of a trip made by bus (red.json's `b`): the bus first and then the train, or the other way, the stop where
// one gives way to the other, when the first arrives there and when the second leaves. Null when the trip is all by
// train: it boards at the change or after it, or the train has no bus. The same train as stopsBetween's
export type Bus = { first: boolean, stop: string, arrives: number, leaves: number };
export function busLeg(iso: string, id: string, from: string, to: string): Bus | null {
  const x = trainOf(iso, id, from, to);
  if(!x?.t.b) return null;
  const ids = x.t.s.map(y => y[0]), i0 = ids.indexOf(x.t.b[0]), i1 = ids.indexOf(x.t.b[1]);
  const change = (i: number, first: boolean): Bus => ({ first, stop: ids[i], arrives: x.t.s[i][1], leaves: x.t.s[i][2] });
  if(x.a >= i0 && x.a < i1 && x.b > i1) return change(i1, true);
  if(x.a < i0 && x.b > i0 && x.b <= i1) return change(i0, false);
  return null;
}
// a stop's name on the big train's route, where room is short: Barcelona's own stations as on the ticket («Catalunya»),
// the others without «Barcelona» before them, only the first of a double name («Altafulla-Tamarit» → «Altafulla»; a
// hyphen inside a name stays: «Vila-seca», «Riba-roja d’Ebre») and, past 16 letters, without its «de …» («Sant
// Vicenç de Calders» → «Sant Vicenç»). A double name whose first half is another stop's name keeps both halves
// (08-11: «Montgat-Nord» is not Montgat, nor the two Montcada i Reixac each other)
const plain = (n: string): string => n.replace(/^Barcelona[- ](Estació de )?/, '');
const firstHalf = (n: string): string => n.replace(/\s*-\s*(?=\p{Lu}).*$/u, '');
let halves: Map<string, number> | null = null;
export function stopName(id: string): string {
  const bcn = BCN.find(s => s.id === id);
  if(bcn) return bcn.short;
  halves ??= Object.values(NET.estaciones).reduce((m, st) => { const h = firstHalf(plain(st.nombre)); return m.set(h, (m.get(h) ?? 0) + 1); }, new Map<string, number>());
  const whole = plain(NET.estaciones[id]?.nombre ?? id), half = firstHalf(whole);
  const n = half !== whole && (halves.get(half) ?? 0) > 1 ? whole : half;
  return n.length > 16 ? n.replace(/ de .*$/, '') : n;
}

// times are minutes after midnight, always in Madrid
// built once: a formatter is costly to build, and the time is asked for on every redraw and every frame of the turn
const MADRID = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function madridNow(): {date: string, min: number} {
  const p = MADRID.formatToParts(new Date());
  const g = (t: Intl.DateTimeFormatPartTypes) => p.find(x=>x.type===t)!.value;
  return {date:`${g('year')}-${g('month')}-${g('day')}`, min:(+g('hour'))*60+(+g('minute'))};
}
export const addDays = (iso: string, n: number): string => { const d=new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
export const weekday = (iso: string): number => new Date(iso+'T12:00:00Z').getUTCDay();
export const hhmm = (m: number): string => { m=((m%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
export const dur = (m: number): string => { if(m<1) return 'ara'; const h=Math.floor(m/60), r=m%60; return h?(r?`${h} h ${r} min`:`${h} h`):`${r} min`; };

// days missing from the data borrow the latest known day of the same kind (weekday, Saturday or Sunday). `station`
// is the Barcelona end of the trip (Sants by default; a parameter already, for 3.5's choice of station)
export function dayData(iso: string, town: string, station: string = SANTS): {d: DayTimetable, exact: boolean} {
  const kind = (x: string) => { const w = weekday(x); return w===6 ? 6 : w===0 ? 0 : 1; };
  const exact = iso in NET.dias, day = exact ? iso : Object.keys(NET.dias).sort().reverse().find(x => kind(x)===kind(iso))!;
  const alt = altOf(town), r = direct(day, station, town), b = direct(day, town, station);
  // a fast train that calls at the town itself is already in r/b
  const elsewhere = (from: string, to: string, own: Train[]) => direct(day, from, to).filter(t => t[3] === FAST && !own.some(x => x[2] === t[2]));
  return {d:{r, b, ar:alt ? elsewhere(station, alt, r) : [], ab:alt ? elsewhere(alt, station, b) : []}, exact};
}
// the last day the timetable covers
export const firstDay = (): string => Object.keys(NET.dias).sort()[0];
export const lastDay = (): string => Object.keys(NET.dias).sort().pop()!;
