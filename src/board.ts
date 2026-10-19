import { hhmm } from './time';
import { lineStyle } from './towns';
import { journey } from './journey';
import { talons } from './talons';
import { cut } from './paper';
import type { Row, Shown } from './shown';

// the board's trips as they read: one row's HTML per trip, the train shown first. Every word of a row is decided here
// («el pròxim» or «ja ha sortit», «després» or «demà», a delay, «cancel·lat», «sense dades», Camp de Tarragona, what a
// screen reader hears); timetable.ts only puts it on the page. Pure: the direction and the phone come in as values, so
// scripts/test/ reads the rows in Node against the frozen timetable
export function board(v: Extract<Shown, { kind: 'train' }>, ida: boolean, phone: boolean): string[] {
  return v.rows.map(r => {
    const row = trip(r, ida, phone, r.big ? journey(v.stops, r.dep, r.arr, v.where?.at ?? null) : '');
    return phone && r.big ? card(row, v) : row;
  });
}

// fewer pieces on a phone (Àlex 19-10, mockup 1): the highlighted time lies on a card of its own, cut with scissors
// like the ticket, and its tear-off strip says how long the trip is and holds «Compra» (talons.ts). The stub stands
// outside the cut, or the cut would take its shadow, the one hard «press me» shadow on a phone
function card(row: string, v: Extract<Shown, { kind: 'train' }>): string {
  return `<div class="carta" style="--cut:${cut(11)}"><div class="cos">${row}<div class="tira"><span class="lema">${v.trip.length} de viatge</span></div></div>${talons(v)}</div>`;
}

// one trip of the board: line, departure, which one it is («el pròxim», with its countdown, and «després»; «demà»
// after today's last AVE, and on the train shown when tomorrow is looked at), arrival. The AVE says under its arrival that it runs from or to Camp de Tarragona, not the
// town. The train shown is big; the other is a button that shows it
// On a phone only the times are left, with the countdown on the big train and «demà» where it applies; every trip
// is a button with a «›» that opens its detail, the big one included
function trip(r: Row, ida: boolean, phone: boolean, rec: string): string {
  const {big, ave: isAve, until, morrow, live} = r;
  // the live delay (option A, Àlex 10-10): the time struck in orange and the new one beside it, the arrival
  // corrected; cancelled, struck; on time, nothing. Unknown says there is no live data yet, never «on time»
  const late = live?.kind === 'late' ? live : null, struck = late || live?.kind === 'cancel' ? ' tach' : '';
  const soonW = `<span class="soon">${until && 'en ' + until}</span>`;
  const arr = late ? (phone ? `→ <span class="nv">${hhmm(late.arr)}</span>` : `→ <s>${hhmm(r.arr)}</s> <span class="nv">${hhmm(late.arr)}</span>`) : `→ ${hhmm(r.arr)}`;
  const arrCls = live?.kind === 'cancel' ? 't arr off' : 't arr';
  if(phone){
    const w = !big ? (morrow ? 'demà' : '') : late ? `<span class="nova">${hhmm(late.dep)}</span>${soonW}`
      : live?.kind === 'cancel' ? '<span class="mes">cancel·lat</span>' : live?.kind === 'unknown' ? `${soonW}<span class="gris">sense dades</span>` : soonW;
    const cells = `<span class="pill" style="${lineStyle(r.line)}">${r.line}</span> <span class="t${struck}"${big ? ' id="dep"' : ''}>${hhmm(r.dep)}</span> `
      + `<span class="w${live ? ' viu' : ''}">${w}</span> <span class="${arrCls}">${arr}</span> <span class="mas" aria-hidden="true">›</span>`;
    const where = isAve ? (ida ? ' a' : ' des de') + ' Camp de Tarragona' : '';
    const said = late ? `, amb ${late.min} min de retard, surt cap a les ${hhmm(late.dep)} i arriba a les ${hhmm(late.arr)}` : live?.kind === 'cancel' ? ', cancel·lat' : '';
    const label = `${isAve ? 'AVE' : r.line} de les ${hhmm(r.dep)}${where}${said || (big && until ? ', surt en ' + until : morrow ? ', demà' : '') + `, arriba a les ${hhmm(r.arr)}`}. Veure el detall i comprar`;
    return `<button type="button" class="trip${big ? ' big' : ' tt'}" data-m="${r.dep}" data-d="${r.day}"${isAve ? ' data-ave' : ''} aria-haspopup="dialog" aria-label="${label}">${cells}</button>`;
  }
  const soon = big ? soonW : '';
  const lead = late ? `<span class="nova">${hhmm(late.dep)}</span><span class="nx"><span class="mes">+${late.min} min</span>${until ? ', ' : ''}</span>${soon}`
    : live?.kind === 'cancel' ? '<span class="nx mes">cancel·lat</span>'
    : `<span class="nx">${r.gone ? 'ja ha sortit' : morrow ? 'demà' : 'el pròxim'}${until ? ', ' : ''}</span>${soon}${live?.kind === 'unknown' ? ' <span class="gris">· sense dades en directe encara</span>' : ''}`;
  const where = big ? lead : morrow ? 'demà' : 'després';
  // the big train's words keep to one line, and its route takes the rest of the gap up to the arrival
  const w = big ? `<span class="lead">${where}</span>${rec}` : where;
  const camp = isAve ? ` <span class="st">${ida ? 'fins a' : 'des de'} Camp de Tarragona</span>` : '';
  // spaces between the cells: the grid ignores them, but the text (and a screen reader) keeps its words apart
  // the time is only a time: the way to Renfe is the stub «Compra» (talons.ts, A3, Àlex 18-10)
  const dep = `<span class="t${struck}"${big ? ' id="dep"' : ''}>${hhmm(r.dep)}</span>`;
  const cells = `<span class="pill" style="${lineStyle(r.line)}">${r.line}</span> ${dep} `
    + `<span class="w">${w}</span> <span class="${arrCls}">${arr}</span>${camp}`;
  if(big) return `<div class="trip big">${cells}</div>`;
  const label = `${isAve ? 'AVE' : r.line} de les ${hhmm(r.dep)}${isAve ? (ida ? ' a' : ' des de') + ' Camp de Tarragona' : ''}, arriba a les ${hhmm(r.arr)}`;
  return `<button type="button" class="trip tt" data-m="${r.dep}" data-d="${r.day}"${isAve ? ' data-ave' : ''} aria-label="${label}">${cells}</button>`;
}
