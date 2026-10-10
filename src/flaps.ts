import { find } from './dom';
import { reduce, state } from './state';
import { NET } from './time';

// The name is a split-flap board (Solari type), like the ones that used to announce the trains: eight cells
// painted in CSS (.tauler), and h1.brand's letters, one per cell. When the hero comes in, the board still shows
// the town it was showing (the chosen one) and every cell walks its drum, one flap at a time, to the letter of
// «Capacasa». The flaps are drawn on a canvas laid over the cells only while they turn; at rest it is gone and
// what shows is the real h1 (the letters' journey measures it, the screen reader reads it). Reduced motion: the
// board is still from the start. When the wall paints the board (world.ts), the flaps are cut from a copy of that
// painting (paint), so the canvas looks like the board under it and nothing changes when it goes; without WebGL
// they take the CSS board's colours.

const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const START = 250, STAGGER = 90, STEP = 62;   // ms: the first cell's wait, the delay from cell to cell, one flap
const TOP = '#2E2924', BOTTOM = '#24201D', HINGE = '#0E0C0B', INK = '#F1EADC';   // the same colours as hero.css

// what the board was showing: the chosen town, in capitals, without accents, centred in the cells; a long name
// keeps its first word (Vilanova i la Geltrú → VILANOVA), cut to the cells if it is still too long
export function boardWord(name: string, cells: number): string {
  let w = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]+/g, ' ').trim();
  if(w.length > cells) w = w.split(' ')[0];
  w = w.slice(0, cells);
  const left = Math.floor((cells - w.length) / 2);
  return (' '.repeat(left) + w).padEnd(cells, ' ');
}

// the letters a cell shows on its way, in the drum's fixed order, from the old letter to the new one
function flapsOf(from: string, to: string): string[] {
  const a = Math.max(0, DRUM.indexOf(from)), b = Math.max(0, DRUM.indexOf(to)), seq: string[] = [];
  for(let k = a; k !== b; k = (k + 1) % DRUM.length) seq.push(DRUM[k]);
  seq.push(DRUM[b]);
  return seq;
}

// CanvasRenderingContext2D.roundRect only exists from Safari 16: this one draws the same with arcTo
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number){
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function createFlaps(paint?: (r: DOMRect) => HTMLCanvasElement | null): { play(): void } {
  const board = find<HTMLElement>('.tauler'), brand = find<HTMLElement>('.brand');
  let raf = 0, canvas: HTMLCanvasElement | null = null;

  function stop(){ cancelAnimationFrame(raf); raf = 0; canvas?.remove(); canvas = null; }

  function play(){
    stop();
    if(reduce) return;
    const cells = [...board.querySelectorAll<HTMLElement>('.celes i')];
    const to = (brand.textContent || '').toUpperCase();
    const from = boardWord(NET.estaciones[state.town]?.nombre ?? '', cells.length);
    const seqs = cells.map((_, i) => flapsOf(from[i], to[i] ?? ' '));
    const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    canvas = cv;
    const ctx = cv.getContext('2d');
    if(!ctx){ canvas = null; return; }
    let t0 = 0, bg: HTMLCanvasElement | null = null;

    function draw(t: number){
      // measured every frame: the hero's entrance moves .top while the flaps turn, and a resize may change the
      // root's size. Each cell is placed by its box relative to the canvas's, brought back to the canvas's own
      // pixels (z) in case the wall is scaled
      const W = cv.clientWidth, H = cv.clientHeight, dpr = devicePixelRatio || 1;
      const cr = cv.getBoundingClientRect(), z = cr.width ? W / cr.width : 1;
      if(cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, W, H);
      const cs = getComputedStyle(brand), fs = parseFloat(cs.fontSize);
      ctx!.font = `400 ${fs}px ${cs.fontFamily}`;
      ctx!.textAlign = 'center'; ctx!.textBaseline = 'alphabetic';
      // the baseline the h1 letters sit on: the line box centres the font's ascent + descent in the cell
      const m = ctx!.measureText('H');
      const asc = m.fontBoundingBoxAscent ?? fs * .9, desc = m.fontBoundingBoxDescent ?? fs * .25;
      const radius = fs * .065;
      cells.forEach((c, i) => {
        const b = c.getBoundingClientRect();
        const x = (b.left - cr.left) * z, y = (b.top - cr.top) * z, w = b.width * z, h = b.height * z;
        const base = y + (h - asc - desc) / 2 + asc;
        const seq = seqs[i], n = (t - (START + i * STAGGER)) / STEP;
        const k = Math.max(0, Math.min(seq.length - 1, Math.floor(n))), turning = n > 0 && k < seq.length - 1;
        const cur = seq[k], next = turning ? seq[k + 1] : cur, p = turning ? n - k : 0;
        const half = (chr: string, top: boolean, scale: number) => {
          const hy = y + h / 2;
          ctx!.save();
          ctx!.translate(0, hy); ctx!.scale(1, scale); ctx!.translate(0, -hy);
          ctx!.beginPath(); ctx!.rect(x, top ? y : hy, w, h / 2); ctx!.clip();
          if(bg) ctx!.drawImage(bg, x * bg.width / W, y * bg.height / H, w * bg.width / W, h * bg.height / H, x, y, w, h);
          else { ctx!.fillStyle = top ? TOP : BOTTOM; ctx!.fillRect(x, y, w, h); }
          if(scale < .999){ ctx!.fillStyle = `rgba(0,0,0,${((1 - scale) * .45).toFixed(3)})`; ctx!.fillRect(x, y, w, h); }
          ctx!.fillStyle = INK; ctx!.fillText(chr, x + w / 2, base);
          ctx!.restore();
        };
        ctx!.save();
        ctx!.beginPath(); rounded(ctx!, x, y, w, h, radius); ctx!.clip();
        half(next, true, 1);                        // behind: the top of the next letter
        half(cur, false, 1);                        // behind: the bottom of the current one
        if(p > 0){
          if(p < .5) half(cur, true, 1 - p * 2);    // the falling flap, first its front
          else half(next, false, p * 2 - 1);        // then its back, landing under the hinge
        }
        ctx!.restore();
        if(!bg){ ctx!.fillStyle = HINGE; ctx!.fillRect(x, y + h / 2 - fs * .01, w, fs * .02); }   // the painted one has its own
      });
    }
    const end = Math.max(...seqs.map((s, i) => START + i * STAGGER + STEP * s.length)) + 40;
    function frame(now: number){
      if(!t0) t0 = now;
      const t = now - t0;
      if(t >= end){ stop(); return; }   // the last flap has landed: the real letters underneath take over
      try { draw(t); } catch { stop(); return; }   // a frame that cannot be drawn leaves the real letters, never a stuck canvas
      raf = requestAnimationFrame(frame);
    }
    // laid over the cells only once Young Serif is in, so the canvas never draws the letters in a fallback font
    document.fonts.ready.then(() => { if(canvas !== cv) return; board.append(cv);
      try { bg = paint ? paint(cv.getBoundingClientRect()) : null; draw(0); } catch { stop(); return; }
      raf = requestAnimationFrame(frame); });
  }
  return { play };
}
