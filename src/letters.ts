import { byId, find } from './dom';
import { pose, type Pose } from './shelf';

// The letters of the name (h1.brand) peel off the wall as paper cut-outs, fly in an arc and land forming the
// first heading of the table (h2#qe). Every chip is drawn by a pure function of the scroll progress p = dropped()
// and a handful of measurements cached at load/resize (never a GSAP timeline with its own state, never our own
// smoothing loop). Updated from the same scroll/resize listener as pitch() in shelf.ts. See
// docs/referencias/viaje-letras.md for the research behind these choices.

// ---------- pure helpers ----------
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const inOut = (t: number): number => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export interface PairEntry { from: string | null; to: string | null; toIndex: number }

// Pair the letters of `name` with the letters of `dest`, in order, by position -- never by semantic identity.
// `dest` may contain spaces (word gaps). If `name` has more letters than `dest` has real (non-space) letters,
// the excess lands on a gap -- one letter past where a direct index would put it, so the gap swallows the
// letter that would otherwise crowd the one before it -- or, lacking a gap, on the nearest position, and fuses
// there. If `name` has fewer letters, the unpaired letters of `dest` are returned alone (from: null): they
// appear in place with a short fade at the end of the journey. See docs/referencias/viaje-letras.md.
export function pair(name: string, dest: string): PairEntry[] {
  const src = [...name];
  const destChars = [...dest];
  const S = src.length;
  const reals: [string, number][] = [];
  const gaps: number[] = [];
  destChars.forEach((c, i) => { if(c === ' ') gaps.push(i); else reals.push([c, i]); });
  const R = reals.length, excess = S - R;
  const gapSource = new Set<number>();
  if(excess > 0){
    for(const g of gaps){
      if(gapSource.size >= excess) break;
      let idx = Math.min(S - 1, g + 1);
      while(gapSource.has(idx) && idx < S - 1) idx++;
      if(!gapSource.has(idx)) gapSource.add(idx);
    }
    for(let i = S - 1; gapSource.size < excess && i >= 0; i--) if(!gapSource.has(i)) gapSource.add(i);
  }
  const nearestGap = (i: number): number => gaps.length
    ? gaps.reduce((b, g) => Math.abs(g - i) < Math.abs(b - i) ? g : b)
    : Math.max(0, destChars.length - 1);
  const entries: PairEntry[] = [];
  let ri = 0;
  for(let i = 0; i < S; i++){
    if(gapSource.has(i)){ entries.push({from: src[i], to: null, toIndex: nearestGap(i)}); continue; }
    if(ri < R){ const [c, idx] = reals[ri++]; entries.push({from: src[i], to: c, toIndex: idx}); }
    else entries.push({from: src[i], to: null, toIndex: nearestGap(i)});
  }
  while(ri < R){ const [c, idx] = reals[ri++]; entries.push({from: null, to: c, toIndex: idx}); }
  return entries;
}

interface Glyph { x: number; y: number; w: number; h: number }
export interface Chip {
  i: number; from: string; to: string; x: number; y: number; w: number; h: number; fontSize: number;
  rz: number; ry: number; scale: number; scrap: number; gone: number; arc: number; wallShade: number; flying: boolean;
}
export interface LettersState { h1Opacity: number; h2Opacity: number; chips: Chip[] }

// the approved prototype's stagger and window (docs/referencias/viaje-letras.md, "Movimiento")
const START0 = .06, STEP = .035, WINDOW = .3;
const letterStart = (i: number): number => START0 + i * STEP;
// the prototype's arc, ~260px tall on a 900px-tall canvas: scaled to the real screen
const ARC = 260 / 900;

let measured = false;
let entries: PairEntry[] = [];
let srcGlyphs: (Glyph | null)[] = [];
let dstGlyphs: (Glyph | null)[] = [];
let srcFont = 16, dstFont = 16;
// #repisa is a normal-flow block: its real width is the layout viewport (excludes a classic scrollbar's own
// width), not innerWidth (which includes it) -- the same distinction table.ts makes with esc.clientWidth. #hero
// needs no such cache: position:fixed;inset:0 is sized to innerWidth regardless of a classic scrollbar. Cached
// at measure() time, never read live in state()/render() (a scroll-time layout read, which the project avoids)
let tableW = 0;

// a single character's box, measured with a Range over every text node in order: h1.brand keeps one letter per
// cell of its board (a span each), h2#qe a single text node (which keeps Young Serif's kerning)
function glyphsOf(el: HTMLElement): (Glyph | null)[] {
  const out: (Glyph | null)[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for(let node = walk.nextNode() as Text | null; node; node = walk.nextNode() as Text | null){
    for(let i = 0; i < node.length; i++){
      const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1);
      const rects = r.getClientRects();
      out.push(rects.length ? {x: rects[0].left + rects[0].width / 2, y: rects[0].top + rects[0].height / 2, w: rects[0].width, h: rects[0].height} : null);
    }
  }
  return out;
}

// measures the rest position of every letter of h1.brand and h2#qe -- with #hero/#repisa's transforms removed,
// never the live (tilted) boxes -- and recomputes the pairing for whatever name is in the page right now.
// Called once fonts are ready and again on every resize (the root scales with the screen, everything in rem).
export function measure(): void {
  const hero = byId('hero'), shelf = byId('repisa'), brand = find<HTMLElement>('.brand'), qe = byId('qe');
  // .top carries its own entrance transition (translateY(6px) -> none, added late by scenery.ts's paint-in):
  // clear it too, or measuring before it settles would cache a few px of vertical offset that never goes away.
  // .top transitions its transform, so the override needs transition:none too, or it would itself animate in
  // over the next second instead of applying instantly -- read straight back out by the very next line
  // The painted board (.pintada) cancels .top's rise with a transform of its own, to be undone the same way
  const top = find<HTMLElement>('.top'), board = find<HTMLElement>('.tauler');
  const heroT = hero.style.transform, shelfT = shelf.style.transform, topT = top.style.transform, topTr = top.style.transition;
  const boardT = board.style.transform, boardTr = board.style.transition;
  hero.style.transform = ''; shelf.style.transform = '';
  top.style.transition = 'none'; top.style.transform = 'none';
  board.style.transition = 'none'; board.style.transform = 'none';
  // the board writes the name in capitals (text-transform): the chips carry the letters as they are seen
  const name = brand.textContent || '';
  entries = pair(getComputedStyle(brand).textTransform === 'uppercase' ? name.toUpperCase() : name, qe.textContent || '');
  srcGlyphs = glyphsOf(brand);   // #hero is position:fixed: its rest position is already viewport-absolute
  // #repisa is a normal-flow element: even with its rotateX cleared, its rest position still moves with the
  // scroll. Cache h2's glyphs relative to #repisa's own top instead, the same local frame '50% 0' rotates around
  const shelfTop = shelf.getBoundingClientRect().top;
  dstGlyphs = glyphsOf(qe).map(g => g && {x: g.x, y: g.y - shelfTop, w: g.w, h: g.h});
  srcFont = parseFloat(getComputedStyle(brand).fontSize) || 16;
  dstFont = parseFloat(getComputedStyle(qe).fontSize) || 16;
  tableW = document.documentElement.clientWidth;
  hero.style.transform = heroT; shelf.style.transform = shelfT;
  top.style.transform = topT; top.style.transition = topTr;
  board.style.transform = boardT; board.style.transition = boardTr;
  resetChips();
  measured = true;
}

// where a point at rest on the wall (h1's plane) lands on screen under the wall's real transform: perspective(P)
// rotateX(wall) scale(s) around 50% fold -- the same transform pitch() gives #hero, worked out in closed form
// instead of multiplying matrices (cheap, and this is the only place that needs it: see viaje-letras.md, #6)
function projectWall(g: Glyph, ps: Pose): {x: number; y: number} {
  const ox = innerWidth / 2, oy = ps.fold;
  const lx = (g.x - ox) * ps.s, ly = (g.y - oy) * ps.s;
  const rad = ps.wall * Math.PI / 180;
  const ry = ly * Math.cos(rad), rz = ly * Math.sin(rad);
  const w = 1 - rz / ps.P;
  return {x: ox + lx / w, y: oy + ry / w};
}
// same, for a point at rest on the table (h2's plane): perspective(P) rotateX(table) around 50% 0, whose 0 is
// #repisa's own top -- which sits at hingeAt(p) on screen, the same hinge the wall shares. g.y already comes in
// relative to that top (see measure()): #repisa moves with the scroll even with its own transform cleared
function projectTable(g: Glyph, ps: Pose): {x: number; y: number} {
  const ox = tableW / 2, ly = g.y;
  const lx = g.x - ox;
  const rad = ps.table * Math.PI / 180;
  const ry = ly * Math.cos(rad), rz = ly * Math.sin(rad);
  const w = 1 - rz / ps.P;
  return {x: ox + lx / w, y: ps.fold + ry / w};
}

// the state of the whole journey at progress p: pure, given the measurements cached by measure(). Before its own
// liftoff a chip tracks the live wall (it hasn't left yet); after it lands it tracks the live table (it rides it
// to p=1); in between it flies between the two poses frozen at the instants it left and arrives.
export function state(p: number): LettersState {
  // the relay to chips happens at the start of the journey (the first letter's own liftoff), never earlier
  const h1Opacity = p <= START0 ? 1 : Math.max(0, 1 - (p - START0) / .03);
  const h2Opacity = clamp01((p - .95) / .05);
  const chips: Chip[] = [];
  if(measured && p > 0 && p < 1){
    entries.forEach((e, i) => {
      if(e.from == null || i >= srcGlyphs.length) return;
      const srcG = srcGlyphs[i];
      const dstG = e.toIndex < dstGlyphs.length ? dstGlyphs[e.toIndex] : null;
      if(!srcG || !dstG) return;
      const start = letterStart(i), end = start + WINDOW;
      const t = clamp01((p - start) / WINDOW);
      const te = inOut(t), arc = Math.sin(Math.PI * t);
      let x: number, y: number;
      if(p <= start){ const q = projectWall(srcG, pose(p)); x = q.x; y = q.y; }
      else if(p >= end){ const q = projectTable(dstG, pose(p)); x = q.x; y = q.y; }
      else {
        const sp = projectWall(srcG, pose(start)), ep = projectTable(dstG, pose(end));
        x = lerp(sp.x, ep.x, te); y = lerp(sp.y, ep.y, te) - arc * ARC * innerHeight;
      }
      // asentamiento: a short overshoot right at the end of the flight, same language as land() in shelf.ts
      const settle = t > .82 ? Math.sin(Math.PI * (t - .82) / .18) : 0;
      const dir = i % 2 ? 1 : -1;
      const rz = arc * 13 * dir - 1.6 * settle * dir;
      // a letter with no letter to become (the gap) never flips: its front just fades away on arrival -- there is
      // no back face to show, so no empty backface to worry about
      const ry = e.to == null ? 0 : 180 * clamp01(t / .7);   // the flip ends before the settle, on a fixed face
      const scale = lerp(1, dstFont / srcFont, te) * (1 + .015 * settle);
      const scrap = clamp01(2.4 * arc);   // cartel <-> recorte follows the arc's height, not time
      const gone = e.to == null ? clamp01((t - .45) * 2.5) : 0;   // a chip with no letter to become melts on arrival
      const wallShade = t <= 0 ? pose(p).shade : 0;   // darkens like the wall's texts only while still glued to it
      const flying = t > 0 && t < 1;   // strictly mid-flight, not glued to the wall or the table: only then is the
      // shadow worth its own compositor layer (will-change solo durante el viaje)
      chips.push({i, from: e.from, to: e.to ?? '', x, y, w: srcFont * 1.3, h: srcFont * 1.3, fontSize: srcFont,
        rz, ry, scale, scrap, gone, arc, wallShade, flying});
    });
  }
  return {h1Opacity, h2Opacity, chips};
}

// ---------- DOM: a pool of .ficha elements, updated from state(), never rebuilt each frame ----------
const DARK = 'rgb(45,36,28)';
let pool: (HTMLElement | null)[] = [];

function resetChips(): void { pool.forEach(el => el && el.remove()); pool = []; }

// a face is two static material layers (cartel/recorte, colors fixed in CSS) crossfaded by opacity, plus a
// plain dark overlay for the wall's wash (--lavado): a black layer at opacity a over color C paints C*(1-a),
// the same brightness*(1-.45*lavado) the wall's own texts use -- so no color is ever computed or written here
function makeFace(cls: string): HTMLElement {
  const cara = document.createElement('div'); cara.className = `cara ${cls}`;
  const cartel = document.createElement('div'); cartel.className = 'mat cartel';
  const recorte = document.createElement('div'); recorte.className = 'mat recorte';
  const lavado = document.createElement('div'); lavado.className = 'lavado';
  cara.append(cartel, recorte, lavado);
  return cara;
}

function makeChip(c: Chip): HTMLElement {
  const el = document.createElement('div'); el.className = 'ficha';
  el.style.width = c.w.toFixed(1) + 'px'; el.style.height = c.h.toFixed(1) + 'px'; el.style.fontSize = c.fontSize.toFixed(2) + 'px';
  const som = document.createElement('div'); som.className = 'som';
  som.style.background = DARK;   // constant: set once here, never rewritten per frame
  const flip = document.createElement('div'); flip.className = 'flip';
  flip.append(makeFace('front'), makeFace('back'));
  el.append(som, flip);
  return el;
}

// transform/opacity only: crossfades the two material layers and the wash overlay, never writes color/background
function faceStyle(cara: HTMLElement, letter: string, scrap: number, wallShade: number): void {
  const cartel = cara.children[0] as HTMLElement, recorte = cara.children[1] as HTMLElement, lavado = cara.children[2] as HTMLElement;
  if(cartel.textContent !== letter){ cartel.textContent = letter; recorte.textContent = letter; }
  cartel.style.opacity = (1 - scrap).toFixed(3);
  recorte.style.opacity = scrap.toFixed(3);
  lavado.style.opacity = (.45 * wallShade).toFixed(3);
}

function syncChips(container: HTMLElement, chips: Chip[]): void {
  const seen = new Set(chips.map(c => c.i));
  pool.forEach((el, i) => { if(el && !seen.has(i)){ el.remove(); pool[i] = null; } });
  chips.forEach(c => {
    let el = pool[c.i];
    if(!el){ el = makeChip(c); pool[c.i] = el; container.appendChild(el); }
    el.style.transform = `translate(${(c.x - c.w / 2).toFixed(1)}px, ${(c.y - c.h / 2).toFixed(1)}px) perspective(900px) rotateZ(${c.rz.toFixed(2)}deg) scale(${c.scale.toFixed(4)})`;
    el.style.opacity = (1 - c.gone).toFixed(3);
    const som = el.children[0] as HTMLElement, flip = el.children[1] as HTMLElement;
    flip.style.transform = `rotateY(${c.ry.toFixed(1)}deg)`;
    const front = flip.children[0] as HTMLElement, back = flip.children[1] as HTMLElement;
    faceStyle(front, c.from, c.scrap, c.wallShade);
    faceStyle(back, c.to, c.scrap, c.wallShade);
    // the hard shadow only exists while the chip is airborne (glued to the wall or the table, it has none of its
    // own -- the text-shadow on its face already reads as "cartel" there): it grows farther and lighter with arc
    som.style.opacity = (.55 * c.arc * (1 - .3 * c.arc) * (1 - c.gone)).toFixed(3);
    som.style.transform = `translate(${(4 + 20 * c.arc).toFixed(1)}px, ${(4 + 20 * c.arc).toFixed(1)}px)`;
    // will-change only for the window a chip is actually in flight, never for the whole 0<p<1 stretch
    som.style.willChange = c.flying ? 'transform, opacity' : 'auto';
  });
}

// draws the journey at progress p: the real h1/h2 fade (color/opacity only, never visibility/display -- they
// stay in the accessibility tree) while the chips relay them
export function render(p: number): void {
  if(!measured) return;
  const st = state(p);
  const brand = find<HTMLElement>('.brand'), qe = byId('qe');
  if(st.h1Opacity < .999) brand.style.opacity = st.h1Opacity.toFixed(3); else brand.style.removeProperty('opacity');
  if(st.h2Opacity < .999) qe.style.opacity = st.h2Opacity.toFixed(3); else qe.style.removeProperty('opacity');
  syncChips(byId('letras'), st.chips);
}

// reduced motion, or the shelf tearing down: no chips, h1/h2 back to their normal (CSS-defined) look
export function reset(): void {
  resetChips();
  const brand = find<HTMLElement>('.brand'), qe = byId('qe');
  brand.style.removeProperty('opacity'); qe.style.removeProperty('opacity');
  measured = false;
}
