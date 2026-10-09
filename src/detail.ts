import './styles/detail.css';
import { byId } from './dom';
import { whatsappUrl } from './home';
import { news, type LineNews } from './notice';

// what the sheet tells about the train shown: its line and trip, times, when it leaves, how long, how many stops,
// the way to buy it, the message for home and what is known of its line's notices
export interface Trip {
  line: string; color: string; from: string; to: string; dep: string; arr: string;
  when: string; length: string; stops: number | null; buy: string; ave: string; home: string; news: LineNews;
}
export interface Detail { open(t: Trip): void; refresh(t: Trip): void }

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// the trip's detail on a phone (6B, Àlex 06-10): a sheet of paper that comes up from the bottom when a train of the
// board is tapped. A native <dialog>, like the town chooser: Esc, the trapped focus and the inert backdrop come
// from the browser. Closing it hands the focus back to the board's big train
export function setupDetail(): Detail {
  const dialog = byId<HTMLDialogElement>('detalle');
  let said = '', line = '';
  function open(t: Trip): void {
    said = news(t.news); line = t.line;
    const stops = t.stops == null ? '' : t.stops === 0 ? 'sense parades' : t.stops === 1 ? '1 parada' : `${t.stops} parades`;
    dialog.innerHTML = `<div class="pliego" tabindex="-1"><button type="button" class="x" aria-label="Tancar">✕</button>
      <h3 id="detalleH"><span class="pill" style="--c:${t.color}">${esc(t.line)}</span> ${esc(t.from)} → ${esc(t.to)}</h3>
      <p class="horas">${t.dep} <span class="flecha">→</span> ${t.arr}</p>
      <p class="datos"><span>${esc(t.when)}</span> <span>${t.length} de viatge${stops ? ' · ' + stops : ''}</span></p>
      ${t.ave ? `<p class="ave">${esc(t.ave)}</p>` : ''}
      ${said}
      <div class="botones"><a class="comprar" href="${esc(t.buy)}" target="_blank" rel="noopener">Compra a Renfe ↗<span class="sr"> (s’obre en una altra pestanya)</span></a>
      <a class="avisa" href="${esc(whatsappUrl(t.home))}" target="_blank" rel="noopener">Avisar a casa<span class="sr"> per WhatsApp</span></a></div></div>`;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('.pliego')?.focus();   // the sheet itself: no ring on a control the finger did not choose
  }
  // the notices can arrive, or change, while the sheet is open: only their block is redrawn (same line), the focus
  // stays put
  function refresh(t: Trip): void {
    const el = dialog.open && t.line === line ? dialog.querySelector('.avisos') : null, html = news(t.news);
    if(el && html !== said){ el.outerHTML = said = html; }
  }
  dialog.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if(t === dialog || t.closest('.x')) dialog.close();                   // the backdrop is the dialog itself, outside .pliego
  });
  dialog.addEventListener('close', () => byId('board').querySelector<HTMLElement>('.big')?.focus({preventScroll:true}));
  return { open, refresh };
}
