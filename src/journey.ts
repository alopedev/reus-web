import { NET, hhmm, stopName, type Bus } from './time';
import { esc } from './html';

// the big train's route, only on a desktop (Àlex 08-10, option A of three): in the gap between the departure and its
// arrival, a line from departure to arrival with a dot at every stop, placed by the time the train reaches it, and
// the stop's name above or below its dot, without its time (Àlex 09-10: the dot's place already says it). When not
// every name fits (a long train, a small screen), the line folds (Àlex 08-10, option B of three): the first two
// stops and the last two keep their names and the stretch in between turns dotted, with «· 15 parades ·» over it.
// While the train is on its way, a paper wagon stands on the line where the timetable puts it (`now`, the share of
// the trip already gone; Àlex 10-10, option A, and only on its way). For the eye only: the screen reader already
// hears the train in #aviso
export function journey(stops: [stop: string, arr: number][] | null, dep: number, arr: number, now: number | null = null, bus: Bus | null = null): string {
  if(!stops || !stops.length || arr <= dep) return '';
  const at = (m: number) => ((m - dep) / (arr - dep) * 100).toFixed(2) + '%';
  if(bus) return byBus(bus, dep, arr);
  const wagon = now == null ? '' : `<span class="vago" style="left:${(now * 100).toFixed(2)}%">${WAGON}</span>`;
  return `<span class="rec" aria-hidden="true"><b style="left:0"></b><b style="left:100%"></b><span class="tram"></span>${stops.map(([id, m]) =>
    `<i style="left:${at(m)}" data-n="${NET.estaciones[id]?.nombre ?? id} ${hhmm(m)}"></i><span class="s" data-at="${at(m)}">${stopName(id)}</span>`).join('')}`
    + `<span class="s pleg" hidden></span>${wagon}</span>`;
}

// a trip that runs part of its way by bus (works on the line; option A, Àlex 05-11): the line goes dashed where it is
// the bus, with a paper bus over it and «en autobús» under it, and solid where it is the train, with «en tren»; at the
// change, the stop's name above and «canvi al tren, 14:14» below (the time the other one leaves). The stops on the
// way are not drawn: the line tells the bus from the train. No wagon on it. fitJourney keeps the words apart
function byBus(bus: Bus, dep: number, arr: number): string {
  const p = (bus.arrives - dep) / (arr - dep) * 100, pc = (x: number) => x.toFixed(2) + '%';
  const [b0, b1] = bus.first ? [0, p] : [p, 100], [t0, t1] = bus.first ? [p, 100] : [0, p];
  const word = (k: number, side: 'up' | 'down', x: number, text: string, anchor = .5) =>
    `<span class="c ${side}" data-at="${pc(x)}" data-x="${anchor}" data-k="${k}" style="left:${pc(x)}">${text}</span>`;
  const change = word(2, 'down', p, `canvi ${bus.first ? 'al tren' : 'a l’autobús'}, ${hhmm(bus.leaves)}`, bus.first ? .1 : .9);
  const busWords = `<span class="autocar" data-at="${pc((b0 + b1) / 2)}" data-k="3" style="left:${pc((b0 + b1) / 2)}">${COACH}</span>`
    + word(3, 'down', (b0 + b1) / 2, 'en autobús');
  const trainWord = word(4, 'up', (t0 + t1) / 2, 'en tren');
  // the solid line only over the train: ::before up to --a, ::after from --b
  return `<span class="rec bus" aria-hidden="true" style="--a:${pc(t0 === 0 ? p : 0)};--b:${pc(t0 === 0 ? 100 : p)}">`
    + `<span class="carretera" style="left:${pc(b0)};width:${pc(b1 - b0)}"></span><b style="left:0"></b><b style="left:100%"></b><i style="left:${pc(p)}"></i>`
    + (bus.first ? busWords + word(1, 'up', p, place(bus.stop)) + change + trainWord
      : trainWord + word(1, 'up', p, place(bus.stop)) + change + busWords) + '</span>';
}
// the same on the train's sheet on a phone (option A): a line, dashed where it is the bus, with the bus drawn in ink
// over it, «autobús», the change and «tren» under it, and the sentence that says it («En autobús fins a la
// Plana-Picamoixons (arriba a les 14:04). Allà, el tren de les 14:14.»). The drawing is for the eye; the words say it
export type TripBus = { first: boolean, stop: string, words: string };
export function busSheet(b: TripBus): string {
  const [x, y] = b.first ? ['bus', 'tr'] : ['tr', 'bus'], [p, q] = b.first ? ['autobús', 'tren'] : ['tren', 'autobús'];
  return `<div class="tramos" aria-hidden="true"><span class="l ${x}"></span><span class="l ${y}"></span>`
    + `<b style="left:0"></b><b style="left:50%"></b><b style="left:100%"></b><span class="autocar" style="left:${b.first ? 25 : 75}%">${INK_COACH}</span>`
    + `<span class="n" style="left:25%">${p}</span><span class="n dalt" style="left:50%">${esc(place(b.stop))}</span><span class="n" style="left:75%">${q}</span></div>`
    + `<p class="frase">${esc(b.words)}</p>`;
}
// a stop's name on the line, its article in lower case as in a sentence («la Plana», as Àlex saw it on 05-11)
const place = (id: string): string => stopName(id).replace(/^(La|Les|El|Els|L’|L')(?=[\s’']|$)/, m => m.toLowerCase());

// a bus, side on, in paper like the wagon: the windows the colour of the wall, the orange band of «ara», dark wheels
export const coachSvg = (body: string, windows: string, line = ''): string => `<svg viewBox="0 0 64 30" aria-hidden="true">`
  + `<rect x="2" y="3" width="60" height="21" rx="4" fill="${body}"${line}/><g fill="${windows}">`
  + [6, 18, 30, 42].map(x => `<rect x="${x}" y="7" width="9" height="8" rx="1"/>`).join('') + '<rect x="54" y="7" width="5" height="11" rx="1"/></g>'
  + '<rect x="2" y="18" width="50" height="1.6" fill="#E8A35C"/><g fill="#2D241C"><circle cx="15" cy="25" r="4"/><circle cx="49" cy="25" r="4"/></g></svg>';
const COACH = coachSvg('#F1EADC', '#6B5645'), INK_COACH = coachSvg('#F1EADC', '#6B5645', ' stroke="#2D241C" stroke-width="1.6"');

// the wagon, side on, its nose towards the arrival (the line always runs from departure to arrival): a paper body
// like the poster's words, windows the colour of the wall, the orange band of «ara» and dark wheels on the line
const BODY = 'M3 5Q3 3 5.5 3H49Q55.5 3 59.5 9.5Q62 13.5 62 18V20.5H3Z';
const WINDOWS = [7, 17, 27, 37].map(x => `<rect x="${x}" y="6.5" width="7.5" height="6" rx="1.2"/>`).join('') + '<path d="M49.5 6.5H54Q57 7.5 58.6 12.5H49.5Z"/>';
const WHEELS = [11, 17, 46, 52].map(x => `<circle cx="${x}" cy="22.6" r="2.3"/>`).join('');
export const wagonSvg = (body: string, windows: string): string => `<svg viewBox="0 0 64 25.5" aria-hidden="true">`
  + `<path d="${BODY}" fill="${body}"/><g fill="${windows}">${WINDOWS}</g><rect x="3" y="15" width="59" height="1.6" fill="#E8A35C"/>`
  + `<g fill="#2D241C">${WHEELS}</g></svg>`;
const WAGON = wagonSvg('#F1EADC', '#6B5645');

type Side = 'up' | 'down';
type Spot = { side: Side, left: number };

// where the labels go, run again whenever the line changes width (the screen, the fonts arriving). First every name,
// each centred on its dot (kept inside the line), on the side opposite the last one shown, else on the same side;
// when the one before is in the way, it slides right as long as it still starts before its dot. If one is left out,
// the line folds instead, keeping two names at each end, else one, else none. Only when even the fold has no room
// (a train of three or four stops on a short line) do the names that fit stay, the others left as bare dots with
// the stop as a tooltip. Two names on one side keep .8rem apart, so they never read as one (Àlex 08-11, 4A)
export function fitJourney(rec: HTMLElement): void {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize), W = rec.clientWidth, gap = .8 * rem;
  // too short a line says nothing: it stays hidden rather than squeeze its dots together
  rec.classList.toggle('off', W < 8 * rem);
  if(rec.classList.contains('bus')){ fitBus(rec, W, gap); return; }
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
  // the name above the line that the wagon would cover climbs over it: no name is lost
  const wagon = rec.querySelector<HTMLElement>('.vago');
  if(wagon){
    const wl = parseFloat(wagon.style.left) / 100 * W - wagon.offsetWidth / 2, wr = wl + wagon.offsetWidth;
    for(const s of [...labels, fold]) s.classList.toggle('alt', !s.hidden && s.classList.contains('up')
      && parseFloat(s.style.left) < wr + gap / 2 && parseFloat(s.style.left) + s.offsetWidth > wl - gap / 2);
  }
}

// the words of a line by bus, each at its place (the change's «canvi …» leaning towards the second vehicle), kept
// inside the line; the first in order of need (the change's name, its time, the bus, «en tren») takes its room, and
// one that would overlap one before it on the same side is left out
function fitBus(rec: HTMLElement, W: number, gap: number): void {
  const items = [...rec.querySelectorAll<HTMLElement>('.c, .autocar')].sort((p, q) => +p.dataset.k! - +q.dataset.k!);
  const taken: { up: [number, number][], down: [number, number][] } = { up: [], down: [] };
  for(const el of items){
    el.hidden = false;
    const w = el.offsetWidth, x = parseFloat(el.dataset.at!) / 100 * W, side = el.classList.contains('down') ? 'down' : 'up';
    const left = Math.max(0, Math.min(W - w, x - parseFloat(el.dataset.x ?? '.5') * w));
    el.style.left = left + 'px';
    if(taken[side].some(([l, r]) => left < r + gap && left + w > l - gap)){ el.hidden = true; continue; }
    taken[side].push([left, left + w]);
  }
}
