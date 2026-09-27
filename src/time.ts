import trains from '../data/trains.json';

// a train: departure and arrival in minutes after midnight, and its number
export type Train = [dep: number, arr: number, id: string];
// one day's timetable: r Sants → Reus, b Reus → Sants, a the high-speed trains (not used yet)
export interface DayTimetable { r: Train[]; b: Train[]; a: (string | number)[][] }
const DATA = trains as unknown as Record<string, DayTimetable>;

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

// days missing from the data borrow the latest known day of the same kind (weekday, Saturday or Sunday)
export function dayData(iso: string): {d: DayTimetable, exact: boolean} {
  if(DATA[iso]) return {d:DATA[iso], exact:true};
  const kind = (x: string) => { const w = weekday(x); return w===6 ? 6 : w===0 ? 0 : 1; };
  const ref = Object.keys(DATA).sort().reverse().find(x => kind(x)===kind(iso))!;
  return {d:DATA[ref], exact:false};
}
// the last day the timetable covers
export const lastDay = (): string => Object.keys(DATA).sort().pop()!;
