import { NET, hhmm, stopName } from './time';

// the big train's route, only on a desktop (Àlex 08-10, option A of three): in the gap between «compra’l ↗» and its
// arrival, a line from departure to arrival with a dot at every stop, placed by the time the train reaches it, and
// the stop's name and time above or below its dot. When not every name fits (a long train, a small screen), the
// line folds (Àlex 08-10, option B of three): the first two stops and the last two keep their names and the stretch
// in between turns dotted, with «· 15 parades ·» over it. For the eye only: the screen reader already hears the
// train in #aviso
export function journey(stops: [stop: string, arr: number][] | null, dep: number, arr: number): string {
  if(!stops || !stops.length || arr <= dep) return '';
  const at = (m: number) => ((m - dep) / (arr - dep) * 100).toFixed(2) + '%';
  return `<span class="rec" aria-hidden="true"><b style="left:0"></b><b style="left:100%"></b><span class="tram"></span>${stops.map(([id, m]) =>
    `<i style="left:${at(m)}" data-n="${NET.estaciones[id]?.nombre ?? id} ${hhmm(m)}"></i><span class="s" data-at="${at(m)}">${stopName(id)} <span class="h">${hhmm(m)}</span></span>`).join('')}`
    + `<span class="s pleg" hidden></span></span>`;
}

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
}
