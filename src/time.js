import DATA from '../data/trains.json';

// times are minutes after midnight, always in Madrid
export function madridNow(){
  const p = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  const g = t => p.find(x=>x.type===t).value;
  return {date:`${g('year')}-${g('month')}-${g('day')}`, min:(+g('hour'))*60+(+g('minute'))};
}
export const addDays = (iso,n) => { const d=new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
export const weekday = iso => new Date(iso+'T12:00:00Z').getUTCDay();
export const hhmm = m => { m=((m%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
export const dur = m => { if(m<1) return 'ahora'; const h=Math.floor(m/60), r=m%60; return h?(r?`${h} h ${r} min`:`${h} h`):`${r} min`; };

// days missing from the data borrow the latest known day of the same kind (weekday, Saturday or Sunday)
export function dayData(iso){
  if(DATA[iso]) return {d:DATA[iso], exact:true};
  const kind = x => { const w = weekday(x); return w===6 ? 6 : w===0 ? 0 : 1; };
  const ref = Object.keys(DATA).sort().reverse().find(x => kind(x)===kind(iso));
  return {d:DATA[ref], exact:false};
}
// the last day the timetable covers
export const lastDay = () => Object.keys(DATA).sort().pop();
