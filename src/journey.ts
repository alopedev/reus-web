import { NET, hhmm, stopName } from './time';

// the big train's route, only on a desktop (Àlex 08-10, option A of three): in the gap between «compra’l ↗» and its
// arrival, a line from departure to arrival with a dot at every stop, placed by the time the train reaches it, and
// the stop's name and time above or below its dot. A label that has no room on either side is left out; its dot
// stays, with the stop's full name and time as a tooltip. For the eye only: the screen reader already hears the train in #aviso
export function journey(stops: [stop: string, arr: number][] | null, dep: number, arr: number): string {
  if(!stops || !stops.length || arr <= dep) return '';
  const at = (m: number) => ((m - dep) / (arr - dep) * 100).toFixed(2) + '%';
  return `<span class="rec" aria-hidden="true"><b style="left:0"></b><b style="left:100%"></b>${stops.map(([id, m]) =>
    `<i style="left:${at(m)}" data-n="${NET.estaciones[id]?.nombre ?? id} ${hhmm(m)}"></i><span class="s" data-at="${at(m)}">${stopName(id)} <span class="h">${hhmm(m)}</span></span>`).join('')}</span>`;
}

// which labels fit, and on which side of the line: from departure to arrival, each label centred on its dot (kept
// inside the line), on the side opposite the last one shown, else on the same side; when the one before is in the
// way, it slides right as long as it still starts before its dot. Run again whenever the line changes width (the
// screen, the fonts arriving)
export function fitJourney(rec: HTMLElement): void {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize), W = rec.clientWidth, gap = .5 * rem;
  // too short a line says nothing: it stays hidden rather than squeeze its dots together
  rec.classList.toggle('off', W < 8 * rem);
  const end = { up: -Infinity, down: -Infinity };
  let side: 'up' | 'down' = 'up';
  rec.querySelectorAll<HTMLElement>('.s').forEach(s => {
    const dot = s.previousElementSibling as HTMLElement; s.hidden = false;
    const x = parseFloat(s.dataset.at!) / 100 * W, w = s.offsetWidth, c = Math.max(0, Math.min(W - w, x - w / 2));
    const at = (sd: 'up' | 'down') => { const l = Math.max(c, end[sd] + gap); return l <= Math.max(c, x - .25 * rem) && l + w <= W ? l : null; };
    let left = at(side);
    if(left === null){ side = side === 'up' ? 'down' : 'up'; left = at(side); }
    s.classList.toggle('up', left !== null && side === 'up'); s.classList.toggle('down', left !== null && side === 'down'); s.hidden = left === null;
    if(left !== null){ s.style.left = left + 'px'; end[side] = left + w; side = side === 'up' ? 'down' : 'up'; }
    dot.title = left === null ? dot.dataset.n! : '';
  });
}
