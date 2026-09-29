import red from '../data/red.json';

// the network timetable (scripts/extract_red.py, contract in docs/referencias/datos-red-contrato.md): every train
// once, with its stops as [stop_id, arrival, departure], and the trains that run each day
export interface Network {
  fuente: string; actualizado: string;
  estaciones: Record<string, { nombre: string; comarca?: string; lineas?: string[]; barcelona?: boolean }>;
  trenes: { n: string; p: string; s: [string, number, number][] }[];
  dias: Record<string, number[]>;
}
// exported so towns.ts can build the chooser's groups from the same parsed network, without reading red.json twice
export const NET = red as unknown as Network;
export const SANTS = '71801', REUS = '71400', CAMP = '04104';
// towns for which the AVE from Camp de Tarragona is a real alternative to the regional (about 35 min instead of 1 h 40 min)
const AVE_COMARCAS = new Set(['Baix Camp', 'Tarragonès']);
const hasAve = (town: string): boolean => AVE_COMARCAS.has(NET.estaciones[town]?.comarca ?? '');
// who the data comes from and when it was updated: Renfe's licence asks for both
export const source = { fuente: NET.fuente, actualizado: NET.actualizado };

// a train: departure and arrival in minutes after midnight, its number and its line (R11…R17, AVE, AVLO)
export type Train = [dep: number, arr: number, id: string, line: string];
// one day's timetable: r Sants → Reus, b Reus → Sants; ar/ab the AVE Sants → Camp de Tarragona and back (only for
// the towns it serves)
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

// times are minutes after midnight, always in Madrid
export function madridNow(): {date: string, min: number} {
  const p = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  const g = (t: Intl.DateTimeFormatPartTypes) => p.find(x=>x.type===t)!.value;
  return {date:`${g('year')}-${g('month')}-${g('day')}`, min:(+g('hour'))*60+(+g('minute'))};
}
export const addDays = (iso: string, n: number): string => { const d=new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
export const weekday = (iso: string): number => new Date(iso+'T12:00:00Z').getUTCDay();
export const hhmm = (m: number): string => { m=((m%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
export const dur = (m: number): string => { if(m<1) return 'ahora'; const h=Math.floor(m/60), r=m%60; return h?(r?`${h} h ${r} min`:`${h} h`):`${r} min`; };

// days missing from the data borrow the latest known day of the same kind (weekday, Saturday or Sunday). `station`
// is the Barcelona end of the trip (Sants by default; a parameter already, for 3.5's choice of station)
export function dayData(iso: string, town: string, station: string = SANTS): {d: DayTimetable, exact: boolean} {
  const kind = (x: string) => { const w = weekday(x); return w===6 ? 6 : w===0 ? 0 : 1; };
  const exact = iso in NET.dias, day = exact ? iso : Object.keys(NET.dias).sort().reverse().find(x => kind(x)===kind(iso))!;
  const ave = hasAve(town);
  return {d:{r:direct(day, station, town), b:direct(day, town, station), ar:ave ? direct(day, station, CAMP) : [], ab:ave ? direct(day, CAMP, station) : []}, exact};
}
// the last day the timetable covers
export const lastDay = (): string => Object.keys(NET.dias).sort().pop()!;
