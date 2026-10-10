import './styles/detail.css';
import { byId } from './dom';
import { whatsappUrl } from './home';
import { news, type LineNews } from './notice';
import { wagonSvg } from './journey';
import type { Where } from './shown';

// what the sheet tells about the train shown: its line and trip, times, when it leaves, how long, how many stops,
// the way to buy it, the message for home and what is known of its line's notices
export interface Trip {
  line: string; color: string; from: string; to: string; dep: string; arr: string;
  when: string; length: string; stops: number | null; buy: string; ave: string; home: string; news: LineNews;
  where: Where | null;               // while the train is on its way: where the timetable puts it
}
export interface Detail { open(t: Trip): void; refresh(t: Trip): void }

// the wagon in ink: the sheet is paper, a paper wagon would vanish on it
const INK = wagonSvg('#2D241C', '#EFE6D2');
// where the train is now, simplified (Àlex 10-10, option A): only its two ends, the wagon between them and the
// words under it. The drawing is for the eye; the words say it
function journeyLine(t: Trip): string {
  if(!t.where) return '';
  return `<div class="viatge"><div class="via" aria-hidden="true"><b style="left:0"></b><b style="left:100%"></b>`
    + `<span class="vago" style="left:${(t.where.at * 100).toFixed(2)}%">${INK}</span></div>`
    + `<div class="ends" aria-hidden="true"><span>${esc(t.from)}</span><span>${esc(t.to)}</span></div><p class="ara">${esc(t.where.words)}</p></div>`;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// the trip's detail on a phone (6B, Àlex 06-10): a sheet of paper that comes up from the bottom when a train of the
// board is tapped. A native <dialog>, like the town chooser: Esc, the trapped focus and the inert backdrop come
// from the browser. Closing it hands the focus back to the board's big train
export function setupDetail(): Detail {
  const dialog = byId<HTMLDialogElement>('detalle');
  let said = '', line = '', drawn = '';
  function open(t: Trip): void {
    said = news(t.news); line = t.line; drawn = journeyLine(t);
    const stops = t.stops == null ? '' : t.stops === 0 ? 'sense parades' : t.stops === 1 ? '1 parada' : `${t.stops} parades`;
    dialog.innerHTML = `<div class="pliego" tabindex="-1"><button type="button" class="x" aria-label="Tancar">✕</button>
      <h3 id="detalleH"><span class="pill" style="--c:${t.color}">${esc(t.line)}</span> ${esc(t.from)} → ${esc(t.to)}</h3>
      <p class="horas">${t.dep} <span class="flecha">→</span> ${t.arr}</p>
      ${journeyLine(t)}
      <p class="datos"><span>${esc(t.when)}</span> <span>${t.length} de viatge${stops ? ' · ' + stops : ''}</span></p>
      ${t.ave ? `<p class="ave">${esc(t.ave)}</p>` : ''}
      ${said}
      <div class="botones"><a class="comprar" href="${esc(t.buy)}" target="_blank" rel="noopener">Compra a Renfe ↗<span class="sr"> (s’obre en una altra pestanya)</span></a>
      <a class="avisa" href="${esc(whatsappUrl(t.home))}" target="_blank" rel="noopener">Avisar a casa<span class="sr"> per WhatsApp</span></a></div></div>`;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('.pliego')?.focus();   // the sheet itself: no ring on a control the finger did not choose
  }
  // the notices can arrive, or change, while the sheet is open: only their block is redrawn (same line), the focus
  // stays put. So does the wagon, a minute further on (gone once the train has arrived)
  function refresh(t: Trip): void {
    const el = dialog.open && t.line === line ? dialog.querySelector('.avisos') : null, html = news(t.news);
    if(el && html !== said){ el.outerHTML = said = html; }
    const way = dialog.open && t.line === line ? journeyLine(t) : drawn;
    if(way !== drawn){ dialog.querySelector('.viatge')?.remove(); dialog.querySelector('.horas')?.insertAdjacentHTML('afterend', way); drawn = way; }
  }
  dialog.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if(t === dialog || t.closest('.x')) dialog.close();                   // the backdrop is the dialog itself, outside .pliego
  });
  dialog.addEventListener('close', () => byId('board').querySelector<HTMLElement>('.big')?.focus({preventScroll:true}));
  return { open, refresh };
}
