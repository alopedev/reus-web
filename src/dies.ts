// «Dia» (22-11, option A of three, Àlex): the sheet that «dia» opens, a calendar of the days the timetable covers,
// Monday to Sunday as calendars are, one button per day. Today in red («avui»: back to now), tomorrow marked «demà»,
// the day looked at stamped as in the other choosers, the first day of a new month named under its number. A day
// without a direct train in this direction, or past the timetable, is struck through and cannot be pressed: the
// sheet never offers a day it has no trains for. Pure: `npm test` runs it (scripts/test/dies.test.ts)
import { addDays, weekday } from './time';
import { dayLong, ofDay } from './ca';

const HEAD = ['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg'];
const MON = ['gen.', 'febr.', 'març', 'abr.', 'maig', 'juny', 'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function calendar(today: string, days: { day: string, trains: boolean }[], looked: string | null): string {
  const last = days.length ? days[days.length - 1].day : today, has = new Map(days.map(d => [d.day, d.trains]));
  const start = addDays(today, -((weekday(today) + 6) % 7)), end = addDays(last, (7 - weekday(last)) % 7);
  let cells = '';
  for(let d = start; d <= end; d = addDays(d, 1)){
    const n = +d.slice(8);
    if(d < today){ cells += '<span class="dd buit" aria-hidden="true"></span>'; continue; }
    const word = d === today ? 'avui' : d === addDays(today, 1) ? 'demà' : n === 1 ? MON[+d.slice(5, 7) - 1] : '';
    const small = word ? `<small>${word}</small>` : '';
    if(d !== today && !has.get(d)){
      cells += `<button type="button" class="dd no" disabled aria-label="${cap(dayLong(d))}, ${has.has(d) ? 'sense tren directe' : 'sense horari'}"><b>${n}</b>${small}</button>`;
      continue;
    }
    const name = d === today ? `Avui, ${dayLong(d)}` : d === addDays(today, 1) ? `Demà, ${dayLong(d)}` : cap(dayLong(d));
    cells += `<button type="button" class="dd${d === today ? ' avui' : ''}" data-day="${d}" aria-label="${name}"${d === looked ? ' aria-current="true"' : ''}><b>${n}</b>${small}</button>`;
  }
  return `<h3 id="diesH">Quin dia?</h3><div class="mes">${HEAD.map(h => `<span class="wd" aria-hidden="true">${h}</span>`).join('')}${cells}</div>`
    + `<p class="fins">Encara no hi ha horaris després ${ofDay(last)}.</p>`;
}

// on a phone the date printed on the ticket is the way into this sheet (option B of «simplify the phone», Àlex 22-11):
// what a screen reader hears on it, the day looked at and what pressing it does
export function dateLabel(day: string, today: string): string {
  const when = day === today ? `avui, ${dayLong(day)}` : day === addDays(today, 1) ? `demà, ${dayLong(day)}` : dayLong(day);
  return `Dia: ${when}. Canviar el dia`;
}
