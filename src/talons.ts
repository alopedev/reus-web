// the stub (option A3 of three, Àlex 18-10): what the highlighted time leads to, out where it is seen, so that nobody
// has to guess it is behind the time. A ticket stub with its notches, a drawing of what it does and its verb, one word
// so it stays narrow: «Compra» opens Renfe's search for the train's trip and day. On a desktop it stands over the time;
// on a phone it heads the board, right of «avui · demà» (#cap; Àlex 19-10, P2 on one line), and since 05-11 it says
// «Agafa’l» (06-11; «Aquest» the day before) and opens the train's sheet, where buying, telling home and reminding live. Pure: the HTML, from shown()
import type { Shown } from './shown';
import type { Trip } from './detail';
import { esc } from './html';
import { whatsappUrl } from './home';

const TICKET = '<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M2 2h24v4.2a2.8 2.8 0 0 0 0 5.6V16H2v-4.2a2.8 2.8 0 0 0 0-5.6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M19 3.5v11" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.6 1.6"/><path d="M6 7h9M6 10.5h6" stroke="#E07A1F" stroke-width="1.8"/></svg>';

// an alarm clock, its hands in the orange of the ticket's lines
const CLOCK = '<svg viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="12.5" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.2 6.2 6.4 3.4M18.8 6.2 15.6 3.4M6.5 19.8 5 21.4M15.5 19.8 17 21.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M11 8.4v4.3l2.8 1.8" stroke="#E07A1F" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';

// a wagon side on, its windows and wheels, a stripe in the orange of the ticket's lines
const WAGON = '<svg viewBox="0 0 30 18" aria-hidden="true"><rect x="2" y="2.5" width="26" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 5.5h4v3.5h-4zM12.5 5.5h4v3.5h-4zM19.5 5.5h4v3.5h-4z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 10.5h26" stroke="#E07A1F" stroke-width="1.6"/><circle cx="8" cy="15" r="1.7" fill="currentColor"/><circle cx="22" cy="15" r="1.7" fill="currentColor"/></svg>';

// «Recorda» (04-11, Àlex: option A of three): on a desktop a second stub by «Compra», the train into the visitor's
// calendar with an alarm 15 min before; a phone's header has room for one stub, so there it lives in the train's
// sheet. The iCalendar file is downloaded and opened by the calendar (the page stays); Google Calendar, a new tab
// On a phone the stub is the way into the train's sheet (05-11, Àlex: B of three, with his word, «Agafa’l» since 06-11): the time
// is not seen to be pressed and the stub is, and the sheet holds buying, telling home and reminding. A button (it goes
// nowhere), for every train shown: the sheet of one gone or cancelled says so
export function talons(s: Shown, phone: boolean): string {
  if(s.kind !== 'train') return '';
  if(phone) return `<button type="button" class="talo agafa" aria-label="${esc(`Obre el tren de les ${s.trip.dep}`)}"><span class="in"><i>${WAGON}</i><span>Agafa’l</span></span></button>`;
  if(!s.buy) return '';
  const label = `Compra a Renfe el tren de les ${s.trip.dep} (s’obre en una altra pestanya)`;
  const buy = `<a class="talo compra" href="${esc(s.buy)}" target="_blank" rel="noopener" aria-label="${esc(label)}"><span class="in"><i>${TICKET}</i><span>Compra</span></span></a>`;
  if(!s.remind) return buy;
  const away = /^https:/.test(s.remind), remind = `Afegeix el tren de les ${s.trip.dep} al teu calendari, amb un avís 15 min abans`;
  return buy + ` <a class="talo recorda" href="${esc(s.remind)}" ${away ? 'target="_blank" rel="noopener"' : 'download'} aria-label="${esc(remind)}"><span class="in"><i>${CLOCK}</i><span>Recorda</span></span></a>`;
}

// the train's sheet on a phone (detail.ts): its ways out as paper buttons. «Recorda-m’ho» (04-11, option A) is not
// downloaded: the iPhone opens the file as an event to add, Android goes to Google Calendar
export function actions(t: Trip): string {
  const away = /^https:/.test(t.remind);
  return (t.buy ? `<a class="comprar" href="${esc(t.buy)}" target="_blank" rel="noopener">Compra a Renfe ↗<span class="sr"> (s’obre en una altra pestanya)</span></a>` : '')
    + ` <a class="avisa" href="${esc(whatsappUrl(t.home))}" target="_blank" rel="noopener">Avisar a casa<span class="sr"> per WhatsApp</span></a>`
    + (t.remind ? ` <a class="recorda" href="${esc(t.remind)}"${away ? ' target="_blank" rel="noopener"' : ''}>Recorda-m’ho<span class="sr">: al teu calendari, amb un avís 15 min abans</span></a>` : '');
}
