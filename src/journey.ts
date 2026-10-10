import { NET, hhmm, stopName } from './time';

// the big train's route, only on a desktop (Àlex 08-10, option A of three): in the gap between «compra’l ↗» and its
// arrival, a line from departure to arrival with a dot at every stop, placed by the time the train reaches it, and
// the stop's name above or below its dot, without its time (Àlex 09-10: the dot's place already says it). When not
// every name fits (a long train, a small screen), the line folds (Àlex 08-10, option B of three): the first two
// stops and the last two keep their names and the stretch in between turns dotted, with «· 15 parades ·» over it.
// While the train is on its way, a paper wagon stands on the line where the timetable puts it (`now`, the share of
// the trip already gone; Àlex 10-10, option A, and only on its way); while it is still to leave, the wagon of the
// one on its way, between the same two stops (`other`; Àlex 10-10, «quiero que se vea más», option A without words),
// a ghost, with the train shown's own wagon parked at its departure, so the other is not read as yours (Àlex 10-10,
// option B of three). For the eye only: the screen reader already hears the train in #aviso
export function journey(stops: [stop: string, arr: number][] | null, dep: number, arr: number, now: number | null = null, other: number | null = null): string {
  if(!stops || !stops.length || arr <= dep) return '';
  const at = (m: number) => ((m - dep) / (arr - dep) * 100).toFixed(2) + '%';
  const wagon = wagons(now, other);
  return `<span class="rec" aria-hidden="true"><b style="left:0"></b><b style="left:100%"></b><span class="tram"></span>${stops.map(([id, m]) =>
    `<i style="left:${at(m)}" data-n="${NET.estaciones[id]?.nombre ?? id} ${hhmm(m)}"></i><span class="s" data-at="${at(m)}">${stopName(id)}</span>`).join('')}`
    + `<span class="s pleg" hidden></span>${wagon}</span>`;
}

// the wagon, side on, its nose towards the arrival (the line always runs from departure to arrival): a paper body
// like the poster's words, windows the colour of the wall, the orange band of «ara» and dark wheels on the line
const BODY = 'M3 5Q3 3 5.5 3H49Q55.5 3 59.5 9.5Q62 13.5 62 18V20.5H3Z';
const WINDOWS = [7, 17, 27, 37].map(x => `<rect x="${x}" y="6.5" width="7.5" height="6" rx="1.2"/>`).join('') + '<path d="M49.5 6.5H54Q57 7.5 58.6 12.5H49.5Z"/>';
const WHEELS = [11, 17, 46, 52].map(x => `<circle cx="${x}" cy="22.6" r="2.3"/>`).join('');
export const wagonSvg = (body: string, windows: string): string => `<svg viewBox="0 0 64 25.5" aria-hidden="true">`
  + `<path d="${BODY}" fill="${body}"/><g fill="${windows}">${WINDOWS}</g><rect x="3" y="15" width="59" height="1.6" fill="#E8A35C"/>`
  + `<g fill="#2D241C">${WHEELS}</g></svg>`;
const WAGON = wagonSvg('#F1EADC', '#6B5645');

// the train shown's wagon under way (`now`), or, while it waits and another is on its way, that one as a ghost and
// yours parked at the departure, drawn last so it stays on top when the two meet
const wagons = (now: number | null, other: number | null): string => {
  const at = (x: number) => `style="left:${(x * 100).toFixed(2)}%"`;
  if(now != null) return `<span class="vago" ${at(now)}>${WAGON}</span>`;
  return other == null ? '' : `<span class="vago altre" ${at(other)}>${WAGON}</span><span class="vago parat" ${at(0)}>${WAGON}</span>`;
};

// a phone's board has no route: under the big row, a bare line from departure to arrival with the same wagons, where
// the timetable puts them (the share of their trip already gone), without words (Àlex 10-10)
export const wagonLine = (now: number | null, other: number | null): string => `<div class="cami" aria-hidden="true"><b style="left:0"></b><b style="left:100%"></b>`
  + `${wagons(now, other)}</div>`;

type Side = 'up' | 'down';
type Spot = { side: Side, left: number };

// where the labels go, run again whenever the line changes width (the screen, the fonts arriving). First every name,
// each centred on its dot (kept inside the line), on the side opposite the last one shown, else on the same side;
// when the one before is in the way, it slides right as long as it still starts before its dot. If one is left out,
// the line folds instead, keeping two names at each end, else one, else none. Only when even the fold has no room
// (a train of three or four stops on a short line) do the names that fit stay, the others left as bare dots with
// the stop as a tooltip
export function fitJourney(rec: HTMLElement): void {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize), W = rec.clientWidth, gap = .5 * rem;
  // too short a line says nothing: it stays hidden rather than squeeze its dots together
  rec.classList.toggle('off', W < 8 * rem);
  const labels = [...rec.querySelectorAll<HTMLElement>('.s:not(.pleg)')], dots = labels.map(s => s.previousElementSibling as HTMLElement);
  const fold = rec.querySelector<HTMLElement>('.pleg')!, n = labels.length;
  labels.forEach((s, i) => { s.hidden = false; dots[i].hidden = false; });
  const xs = labels.map(s => parseFloat(s.dataset.at!) / 100 * W), ws = labels.map(s => s.offsetWidth);
  const centre = (x: number, w: number) => Math.max(0, Math.min(W - w, x - w / 2));

  // every name, zigzagging
  const spots: (Spot | null)[] = [], end = { up: -Infinity, down: -Infinity };
  let side: Side = 'up';
  labels.forEach((_, i) => {
    const at = (sd: Side) => { const c = centre(xs[i], ws[i]), l = Math.max(c, end[sd] + gap); return l <= Math.max(c, xs[i] - .25 * rem) && l + ws[i] <= W ? l : null; };
    let left = at(side);
    if(left === null){ side = side === 'up' ? 'down' : 'up'; left = at(side); }
    spots.push(left === null ? null : { side, left });
    if(left !== null){ end[side] = left + ws[i]; side = side === 'up' ? 'down' : 'up'; }
  });

  // folded: k names at each end (the first one above the line, the next below), at least two stops in the fold
  let folded: { spots: (Spot | null)[], a: number, b: number, left: number, side: Side } | null = null;
  if(spots.includes(null)) for(let k = 2; k >= 0 && !folded; k--){
    if(n - 2 * k < 2) continue;
    fold.textContent = `· ${n - 2 * k} parades ·`; fold.hidden = false;
    const fw = fold.offsetWidth, a = k ? xs[k - 1] : 0, b = k ? xs[n - k] : W;
    const kept: (Spot | null)[] = labels.map((_, i) => i < k || i >= n - k
      ? { side: i % 2 === (i < k ? 0 : (n - k) % 2) ? 'up' : 'down', left: centre(xs[i], ws[i]) } : null);
    const left = (a + b) / 2 - fw / 2;
    // nothing overlaps on either side, the fold's word over the dotted stretch included (above it, else below)
    for(const fs of ['up', 'down'] as Side[]){
      const boxes = [...kept.flatMap((p, i) => p ? [{ ...p, w: ws[i] }] : []), { side: fs, left, w: fw }];
      const clear = (['up', 'down'] as Side[]).every(sd => boxes.filter(x => x.side === sd).sort((p, q) => p.left - q.left)
        .every((p, j, all) => j === 0 || all[j - 1].left + all[j - 1].w + gap <= p.left));
      if(clear && left >= a && left + fw <= b){ folded = { spots: kept, a, b, left, side: fs }; break; }
    }
  }

  const shown = folded ? folded.spots : spots;
  labels.forEach((s, i) => {
    const p = shown[i], inFold = !!folded && !p;
    s.hidden = !p; s.classList.toggle('up', p?.side === 'up'); s.classList.toggle('down', p?.side === 'down');
    if(p) s.style.left = p.left + 'px';
    dots[i].hidden = inFold; dots[i].title = p || inFold ? '' : dots[i].dataset.n!;
  });
  rec.classList.toggle('plegat', !!folded);
  fold.hidden = !folded; fold.classList.toggle('up', folded?.side === 'up'); fold.classList.toggle('down', folded?.side === 'down');
  if(folded){
    rec.style.setProperty('--a', folded.a + 'px'); rec.style.setProperty('--b', folded.b + 'px');
    fold.style.left = folded.left + 'px';
    // the folded stops, for the mouse
    fold.title = dots.filter(d => d.hidden).map(d => d.dataset.n).join(', ');
  } else { rec.style.removeProperty('--a'); rec.style.removeProperty('--b'); fold.textContent = ''; fold.title = ''; }
  // the name above the line that a wagon would cover climbs over it: no name is lost
  const spans = [...rec.querySelectorAll<HTMLElement>('.vago')].map(v => {
    // its own shift (centred on its place, or the parked one's tail just behind the departure)
    const l = parseFloat(v.style.left) / 100 * W + new DOMMatrix(getComputedStyle(v).transform).m41;
    return [l, l + v.offsetWidth]; });
  for(const s of [...labels, fold]) s.classList.toggle('alt', !s.hidden && s.classList.contains('up')
    && spans.some(([wl, wr]) => parseFloat(s.style.left) < wr + gap / 2 && parseFloat(s.style.left) + s.offsetWidth > wl - gap / 2));
}
