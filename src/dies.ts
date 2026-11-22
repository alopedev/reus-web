// «Dia» (22-11, option A of three, Àlex; «un altre dia» since that evening): the sheet that «un altre dia» opens, a
// calendar of the days the timetable covers, Monday to Sunday as calendars are, one button per day. Today in red («avui»: back to now), tomorrow marked «demà»,
// the day looked at stamped as in the other choosers, the first day of a new month named under its number. A day
// without a direct train in this direction, or past the timetable, is struck through and cannot be pressed: the
// sheet never offers a day it has no trains for. Pure: `npm test` runs it (scripts/test/dies.test.ts)
import { addDays, weekday } from './time';
import { dayLong, ofDay } from './ca';
import { torn } from './paper';
import { dotText, padMonth } from './dots';

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

// The pad over the ruler (B3, Àlex 15-10; drawing A, 15-10): a cardboard printing the month in dots, and two sheets
// hanging from its perforation, their bottom torn by hand (no weekday since 18-10, H2). «avui» carries today's number;
// the second says «un altre dia» (Àlex, 22-11 evening: «dia» that morning, «demà» before; «després» was turned down,
// it is already the board's second row) and, until a day is chosen, a tiny wall calendar in colour: the pad's own cardboard with two staples over a torn sheet, a day in red
// (drawing C of three, the same world as the pad above it). Once a day is chosen, its number. The key stays `dia`
const TACO = '<svg class="cal" viewBox="0 0 22 24" aria-hidden="true">'
  + '<path d="M2.6 8.6h16.8v11.2l-1.6 1.5-1.5-1.1-1.7 1.3-1.6-1.2-1.8 1.4-1.5-1.3-1.7 1.2-1.6-1.3-1.8 1.1-1.6-1.4-1.4 1z" fill="#F1EADC" stroke="#2D241C" stroke-width="1.1" stroke-linejoin="round"/>'
  + '<rect x="1.6" y="3.4" width="18.8" height="6" rx="1" fill="#6E4232" stroke="#2D241C" stroke-width="1.1"/>'
  + '<rect x="5.2" y="2.2" width="1.8" height="3.6" rx=".5" fill="#B9B3AA"/><rect x="15" y="2.2" width="1.8" height="3.6" rx=".5" fill="#B9B3AA"/>'
  + '<g fill="#2D241C">' + [[6.4, 12.6], [9.5, 12.6], [12.6, 12.6], [15.7, 12.6], [6.4, 15.9], [9.5, 15.9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".95"/>`).join('')
  + '<circle cx="12.6" cy="15.9" r=".95" fill="#C8432B"/></g></svg>';
const longDay = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

export function pad(today: string, on: 'avui' | 'dia', day: string): string {
  const seen = on === 'dia' ? day : '';
  const sheet = (key: string, word: string, num: string, label: string, on: boolean, seed: number, popup = false) =>
    `<button type="button" class="full${on ? ' on' : ''}" data-dia="${key}"${popup ? ' aria-haspopup="dialog"' : ''} aria-pressed="${on}" aria-label="${label}">`
    + `<span class="pp" aria-hidden="true" style="clip-path:${torn(seed)}"><span class="perf"></span>`
    + `<i>${word}</i> <b>${num}</b></span></button>`;
  return `<span class="taco" aria-hidden="true">${dotText(padMonth(today, seen || addDays(today, 1)), '#F1EADC')}</span>`
    + sheet('avui', 'avui', String(+today.slice(8)), `Avui, ${longDay(today)}`, on === 'avui', 7)
    + sheet('dia', 'un altre dia', seen ? String(+seen.slice(8)) : TACO, seen ? `${cap(longDay(seen))}. Tria un altre dia` : 'Un altre dia', on === 'dia', 20, true);
}
