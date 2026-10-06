import './styles/detail.css';
import { byId } from './dom';
import { whatsappUrl } from './home';

// what the sheet tells about the train shown: its line and trip, times, when it leaves, how long, how many stops,
// the way to buy it and the message for home
export interface Trip {
  line: string; color: string; from: string; to: string; dep: string; arr: string;
  when: string; length: string; stops: number | null; buy: string; ave: string; home: string;
}
export interface Detail { open(t: Trip): void }

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// the trip's detail on a phone (6B, Àlex 06-10): a sheet of paper that comes up from the bottom when a train of the
// board is tapped. A native <dialog>, like the town chooser: Esc, the trapped focus and the inert backdrop come
// from the browser. Closing it hands the focus back to the board's big train
export function setupDetail(): Detail {
  const dialog = byId<HTMLDialogElement>('detalle');
  function open(t: Trip): void {
    const stops = t.stops == null ? '' : t.stops === 0 ? 'sin paradas' : t.stops === 1 ? '1 parada' : `${t.stops} paradas`;
    dialog.innerHTML = `<div class="pliego" tabindex="-1"><button type="button" class="x" aria-label="Cerrar">✕</button>
      <h3 id="detalleH"><span class="pill" style="--c:${t.color}">${esc(t.line)}</span> ${esc(t.from)} → ${esc(t.to)}</h3>
      <p class="horas">${t.dep} <span class="flecha">→</span> ${t.arr}</p>
      <p class="datos"><span>${esc(t.when)}</span> <span>${t.length} de viaje${stops ? ' · ' + stops : ''}</span></p>
      ${t.ave ? `<p class="ave">${esc(t.ave)}</p>` : ''}
      <div class="botones"><a class="comprar" href="${esc(t.buy)}" target="_blank" rel="noopener">Comprar en Renfe ↗<span class="sr"> (abre otra pestaña)</span></a>
      <a class="avisa" href="${esc(whatsappUrl(t.home))}" target="_blank" rel="noopener">Avisar a casa<span class="sr"> por WhatsApp</span></a></div></div>`;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('.pliego')?.focus();   // the sheet itself: no ring on a control the finger did not choose
  }
  dialog.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if(t === dialog || t.closest('.x')) dialog.close();                   // the backdrop is the dialog itself, outside .pliego
  });
  dialog.addEventListener('close', () => byId('board').querySelector<HTMLElement>('.big')?.focus({preventScroll:true}));
  return { open };
}
