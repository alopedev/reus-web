import { hhmm, type Bus } from './time';
import { lineStyle } from './towns';
import { journey } from './journey';
import { busWords, type Row, type Shown } from './shown';
import { atPlace, ofPlace } from './ca';

// the board's trips as they read: one row's HTML per trip, the train shown first. Every word of a row is decided here
// («el pròxim» or «ja ha sortit», «després» or «demà», a delay, «cancel·lat», «sense dades», the other station, what a
// screen reader hears); timetable.ts only puts it on the page. Pure: the direction and the phone come in as values, so
// scripts/test/ reads the rows in Node against the frozen timetable
// The window first on a phone (Àlex 19-10, P2 on one line): the board is one line, the highlighted time alone; the
// next trip is on the ruler and in the train's sheet
export function board(v: Extract<Shown, { kind: 'train' }>, ida: boolean, phone: boolean): string[] {
  return v.rows.filter(r => !phone || r.big).map(r => trip(r, ida, phone, r.big ? journey(v.stops, r.dep, r.arr, v.where?.at ?? null, v.bus) : '', r.big ? v.bus : null));
}

// one trip of the board: line, departure, which one it is («el pròxim», with its countdown, and «després»; «demà»
// after today's last fast train from the other station, and on the train shown when tomorrow is looked at), arrival. A fast
// train from or to the town's other station says so under its arrival, as the AVE did (Àlex, 08-11): Camp de Tarragona,
// Figueres-Vilafant, not the town. The train shown is big; the other is a button that shows it
// On a phone only the times are left, and a line under them; the trip is a button that opens its detail
// a trip that runs part of its way by bus (works on the line, option A, Àlex 05-11): on a phone, «bus + tren» (or
// «tren + bus») on that line
function trip(r: Row, ida: boolean, phone: boolean, rec: string, bus: Bus | null): string {
  const {big, ave: isAve, until, morrow, live} = r;
  // the live delay (option A, Àlex 10-10): the time struck in orange and the new one beside it, the arrival
  // corrected; cancelled, struck; on time, nothing. Unknown says there is no live data yet, never «on time»
  const late = live?.kind === 'late' ? live : null, struck = late || live?.kind === 'cancel' ? ' tach' : '';
  const soonW = `<span class="soon">${until && 'en ' + until}</span>`;
  const arr = late ? (phone ? `→ <span class="nv">${hhmm(late.arr)}</span>` : `→ <s>${hhmm(r.arr)}</s> <span class="nv">${hhmm(late.arr)}</span>`) : `→ ${hhmm(r.arr)}`;
  const arrCls = live?.kind === 'cancel' ? 't arr off' : 't arr';
  if(phone){
    // two lines (C of «simplify the phone», Àlex 24-11): the times, and under them the countdown, where the train arrives when it is not the
    // town (a fast train to Camp de Tarragona or Figueres-Vilafant), the bus and «sense dades». No «›»: «Agafa’l» is the
    // sign. A delay keeps its new time beside the struck one; a cancellation says so in place of the countdown
    const nova = late ? ` <span class="nova">${hhmm(late.dep)}</span>` : '';
    // one line, always (25-11): each part is a piece with its priority, and nota.ts leaves out what does not fit,
    // highest first; where a fast train arrives (0) never leaves, nor a cancellation
    const words: [string, number][] = live?.kind === 'cancel' ? [['<span class="mes">cancel·lat</span>', 0]] : ([
      [big ? (until ? 'en ' + until : r.gone ? 'ja ha sortit' : morrow) : morrow, 2],
      [isAve ? (ida ? 'baixa ' + atPlace(r.other) : 'surt ' + ofPlace(r.other)) : '', 0],
      [bus ? `<span class="gris">${bus.first ? 'bus + tren' : 'tren + bus'}</span>` : '', 1],
      [live?.kind === 'unknown' ? '<span class="gris">sense dades</span>' : '', 3],
    ] as [string, number][]).filter(([w]) => w);
    const note = words.map(([w, p]) => `<span data-p="${p}">${w}</span>`).join('<span class="sep"> · </span>');
    const cells = `<span class="pill" style="${lineStyle(r.line)}">${r.line}</span> <span class="t${struck}"${big ? ' id="dep"' : ''}>${hhmm(r.dep)}</span>${nova} `
      + `<span class="${arrCls}">${arr}</span> <span class="nota">${note}</span>`;
    const where = isAve ? (ida ? ' a ' : ' des de ') + r.other : '';
    const said = late ? `, amb ${late.min} min de retard, surt cap a les ${hhmm(late.dep)} i arriba a les ${hhmm(late.arr)}` : live?.kind === 'cancel' ? ', cancel·lat' : '';
    const label = `${r.line} de les ${hhmm(r.dep)}${where}${said || (big && until ? ', surt en ' + until : morrow ? ', ' + morrow : '') + `, arriba a les ${hhmm(r.arr)}`}${bus ? ', ' + busWords(bus) : ''}. Veure el detall i comprar`;
    return `<button type="button" class="trip${big ? ' big' : ' tt'}" data-m="${r.dep}" data-d="${r.day}"${isAve ? ' data-ave' : ''} aria-haspopup="dialog" aria-label="${label}">${cells}</button>`;
  }
  const soon = big ? soonW : '';
  const lead = late ? `<span class="nova">${hhmm(late.dep)}</span><span class="nx"><span class="mes">+${late.min} min</span>${until ? ', ' : ''}</span>${soon}`
    : live?.kind === 'cancel' ? '<span class="nx mes">cancel·lat</span>'
    : `<span class="nx">${r.gone ? 'ja ha sortit' : morrow || 'el pròxim'}${until ? ', ' : ''}</span>${soon}${live?.kind === 'unknown' ? ' <span class="gris">· sense dades</span>' : ''}`;
  const where = big ? lead : morrow || 'després';
  // the big train's words keep to one line, and its route takes the rest of the gap up to the arrival
  const w = big ? `<span class="lead">${where}</span>${rec}` : where;
  const camp = isAve ? ` <span class="st">${ida ? 'fins a' : 'des de'} ${r.other}</span>` : '';
  // spaces between the cells: the grid ignores them, but the text (and a screen reader) keeps its words apart
  // the time is only a time: the way to Renfe is the stub «Compra» (talons.ts, A3, Àlex 18-10)
  const dep = `<span class="t${struck}"${big ? ' id="dep"' : ''}>${hhmm(r.dep)}</span>`;
  const cells = `<span class="pill" style="${lineStyle(r.line)}">${r.line}</span> ${dep} `
    + `<span class="w">${w}</span> <span class="${arrCls}">${arr}</span>${camp}`;
  if(big) return `<div class="trip big">${cells}</div>`;
  const label = `${r.line} de les ${hhmm(r.dep)}${isAve ? (ida ? ' a ' : ' des de ') + r.other : ''}, arriba a les ${hhmm(r.arr)}`;
  return `<button type="button" class="trip tt" data-m="${r.dep}" data-d="${r.day}"${isAve ? ' data-ave' : ''} aria-label="${label}">${cells}</button>`;
}
