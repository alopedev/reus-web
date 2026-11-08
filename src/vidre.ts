// the mist on the window (vaho.ts), what is pure in it: what the first visit's word says, and whether it is due. Pure:
// the store is passed in, so scripts/test/ runs it
interface Store { getItem(k: string): string | null; setItem(k: string, v: string): void }

const KEY = 'capacasa.vaho';

// the words wiped in the mist, as if someone had written them on the glass with a finger: the same for a finger and a
// mouse (Àlex 08-11: «Bon viatge», nothing else on the glass)
export const HINT = 'Bon viatge';

// the word comes once per browser (said in #privacitat). A store that keeps nothing (a private window, blocked site
// data) shows it every visit rather than never
export function hintDue(store: Store | null): boolean {
  try { if(store?.getItem(KEY)) return false; } catch { return true; }
  try { store?.setItem(KEY, '1'); } catch { /* not remembered */ }
  return true;
}

// the words as a hand writes them with a finger on the misted glass, joined up (Àlex 08-11, A of three: joined, capitals,
// print): strokes in the order a hand makes them, not a font (the web has two, and a font looks printed). A rough path
// in units of the x-height, baseline at 0, that handwriting() smooths and fits to the words' width
type Pt = [number, number];
const ROUGH: Pt[][] = [
  [[0, -2.1], [.02, -1], [0, 0]],
  [[-.2, -1.9], [.5, -2.15], [1, -1.8], [.9, -1.25], [.35, -1.05], [.9, -.95], [1.15, -.5], [.85, -.08], [.3, 0],
    [-.1, -.05]],
  [[1.85, -1], [1.5, -.85], [1.4, -.35], [1.65, -.02], [1.95, -.3], [2, -.8], [1.85, -1], [2.1, -.95],
    [2.35, -.95], [2.42, -.5], [2.42, 0], [2.5, -.6], [2.75, -1], [3, -.8], [3.05, -.3], [3.1, -.03], [3.35, -.15]],
  [[3.95, -.85], [4.1, -1], [4.25, -.6], [4.45, 0], [4.65, -.55], [4.8, -1], [4.72, -.85], [4.95, -.8],
    [5.15, -.9], [5.25, -1], [5.22, -.4], [5.3, -.05], [5.55, -.15], [5.85, -.6], [6.15, -.85], [5.9, -1.02],
    [5.6, -.85], [5.45, -.4], [5.6, -.05], [5.9, -.15], [6.15, -.75], [6.2, -1], [6.18, -.4], [6.3, -.05],
    [6.55, -.2], [6.75, -1], [6.85, -1.9], [6.82, -1], [6.8, -.3], [6.95, -.02], [7.2, -.15], [7.55, -.6],
    [7.9, -.85], [7.65, -1.02], [7.35, -.85], [7.25, -.4], [7.45, -.05], [7.75, -.2], [7.95, -.75], [8, -1],
    [7.98, 0], [7.9, .8], [7.6, 1.05], [7.35, .8], [7.6, .3], [8.1, -.1], [8.35, -.3], [8.7, -.55], [8.85, -.85],
    [8.7, -1], [8.5, -.8], [8.45, -.35], [8.65, -.03], [9, -.15]],
  [[6.5, -1.15], [6.8, -1.18], [7.15, -1.2]],
  [[5.27, -1.55], [5.3, -1.5]],
];

// the strokes smoothed (Catmull-Rom) and fitted: x from 0 to 1 across the word, y in the same unit, baseline at 0
export function handwriting(): Pt[][] {
  const slant = .12;
  const smooth = ROUGH.map(k => {
    if(k.length < 3) return k.map(p => [p[0], p[1]] as Pt);
    const P = [k[0], ...k, k[k.length - 1]], out: Pt[] = [];
    for(let i = 1; i < P.length - 2; i++) for(let j = 0; j < 6; j++){
      const t = j/6, t2 = t*t, t3 = t2*t, c = (a: number, b: number, e: number, d: number) =>
        .5*(2*b + (e - a)*t + (2*a - 5*b + 4*e - d)*t2 + (3*b - a - 3*e + d)*t3);
      out.push([c(P[i - 1][0], P[i][0], P[i + 1][0], P[i + 2][0]), c(P[i - 1][1], P[i][1], P[i + 1][1], P[i + 2][1])]);
    }
    out.push(k[k.length - 1]); return out;
  }).map(k => k.map(([x, y]) => [x - y*slant, y + .04*Math.sin(x*2.3)] as Pt));   // a hand leans and its line wanders
  const xs = smooth.flatMap(k => k.map(p => p[0])), x0 = Math.min(...xs), w = Math.max(...xs) - x0;
  return smooth.map(k => k.map(([x, y]) => [(x - x0)/w, y/w] as Pt));
}

// what the hand has written by f (0 to 1) of the time it takes: the strokes in order, the last one cut where the finger
// is; lifting the finger between strokes takes a moment too
export function written(strokes: Pt[][], f: number): Pt[][] {
  if(f >= 1) return strokes.map(k => k.slice());
  const LIFT = .04, seg = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const total = strokes.reduce((s, k) => s + LIFT + k.slice(1).reduce((a, p, i) => a + seg(k[i], p), 0), 0);
  let left = Math.max(0, f)*total; const out: Pt[][] = [];
  for(const k of strokes){
    left -= LIFT; if(left <= 0) break;
    const done: Pt[] = [k[0]];
    for(let i = 1; i < k.length; i++){
      const d = seg(k[i - 1], k[i]);
      if(left >= d){ done.push(k[i]); left -= d; continue; }
      const t = left/d; done.push([k[i - 1][0] + (k[i][0] - k[i - 1][0])*t, k[i - 1][1] + (k[i][1] - k[i - 1][1])*t]); left = 0; break;
    }
    out.push(done); if(left <= 0) break;
  }
  return out;
}
