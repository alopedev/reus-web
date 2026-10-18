// the stubs by the pad (option A3 of three, Àlex 18-10): what the highlighted time leads to, out on the wall, so that
// nobody has to guess it is behind the time. Ticket stubs with their notches, a drawing of what each does and its verb:
// «Compra ↗» opens Renfe's search for the train's trip and day; «Avisa a casa», only on a phone (on a desktop there
// is no «avisar», Àlex 06-10), opens WhatsApp with the train written. Pure: the HTML, from what shown() decided
import type { Shown } from './shown';
import { whatsappUrl } from './home';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const TICKET = '<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M2 2h24v4.2a2.8 2.8 0 0 0 0 5.6V16H2v-4.2a2.8 2.8 0 0 0 0-5.6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M19 3.5v11" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.6 1.6"/><path d="M6 7h9M6 10.5h6" stroke="#E07A1F" stroke-width="1.8"/></svg>';

const HOUSE = '<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.8 20v-5.2h4.4V20" fill="#E07A1F" stroke="currentColor" stroke-width="1.3"/><path d="M2 11.5 12 3l10 8.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

const stub = (cls: string, href: string, icon: string, word: string, label: string) =>
  `<a class="talo ${cls}" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${label}"><span class="in"><i>${icon}</i><span>${word}</span></span></a>`;

export function talons(s: Shown, phone: boolean): string {
  if(s.kind !== 'train') return '';
  return (s.buy ? stub('compra', s.buy, TICKET, 'Compra ↗', `Compra a Renfe el tren de les ${s.trip.dep} (s’obre en una altra pestanya)`) : '')
    + (phone ? stub('avisa', whatsappUrl(s.trip.home), HOUSE, 'Avisa a casa', 'Avisa a casa per WhatsApp') : '');
}
