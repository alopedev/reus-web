// the stub (option A3 of three, Àlex 18-10): what the highlighted time leads to, out where it is seen, so that nobody
// has to guess it is behind the time. A ticket stub with its notches, a drawing of what it does and its verb, one word
// so it stays narrow: «Compra» opens Renfe's search for the train's trip and day. On a desktop it stands over the time;
// on a phone it heads the board, right of «avui · demà» (#cap; Àlex 19-10, P2 on one line), and telling home («Avisar
// a casa») lives in the train's sheet only. Pure: the HTML, from shown()
import type { Shown } from './shown';
import { esc } from './html';

const TICKET = '<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M2 2h24v4.2a2.8 2.8 0 0 0 0 5.6V16H2v-4.2a2.8 2.8 0 0 0 0-5.6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M19 3.5v11" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.6 1.6"/><path d="M6 7h9M6 10.5h6" stroke="#E07A1F" stroke-width="1.8"/></svg>';

export function talons(s: Shown): string {
  if(s.kind !== 'train' || !s.buy) return '';
  const label = `Compra a Renfe el tren de les ${s.trip.dep} (s’obre en una altra pestanya)`;
  return `<a class="talo compra" href="${esc(s.buy)}" target="_blank" rel="noopener" aria-label="${esc(label)}"><span class="in"><i>${TICKET}</i><span>Compra</span></span></a>`;
}
