// the mist on the window (vaho.ts), what is pure in it: what the first visit's word says, and whether it is due. Pure:
// the store is passed in, so scripts/test/ runs it
interface Store { getItem(k: string): string | null; setItem(k: string, v: string): void }

const KEY = 'capacasa.vaho';

// the word wiped in the mist, as if someone had written it on the glass: one word, the same for a finger and a mouse
// (Àlex 08-11: «Dibuixa», nothing else on the glass)
export const HINT = 'Dibuixa';

// the word comes once per browser (said in #privacitat). A store that keeps nothing (a private window, blocked site
// data) shows it every visit rather than never
export function hintDue(store: Store | null): boolean {
  try { if(store?.getItem(KEY)) return false; } catch { return true; }
  try { store?.setItem(KEY, '1'); } catch { /* not remembered */ }
  return true;
}

// «Dibuixa» as a hand writes it with a finger on the misted glass (Àlex 08-11): strokes in the order a hand makes them,
// not a font (the web has two, and a font looks printed). Three hands to choose from; the points are a rough path in
// units of the letter height that handwriting() smooths and fits to the word's width
type Pt = [number, number];
export const HANDS = ['lligada', 'majuscules', 'impremta'] as const;
export type Hand = typeof HANDS[number];
const D: Pt[][] = [[[0, -2], [.03, -1], [0, 0]], [[0, -2], [.7, -1.85], [1.05, -1], [.75, -.15], [0, 0]]];
const ROUGH: Record<Hand, Pt[][]> = {
  lligada: [
    [[0, -2.1], [.02, -1], [0, 0]],
    [[-.25, -1.85], [.4, -2.15], [1.05, -1.75], [1.25, -1], [.95, -.3], [.35, -.02], [-.1, 0]],
    [[1.45, -.15], [1.7, -.75], [1.78, -1], [1.76, -.4], [1.85, -.05], [2.1, -.1], [2.45, -.9], [2.6, -1.8], [2.45, -2.15], [2.3, -1.8],
      [2.25, -.8], [2.25, -.05], [2.6, -.1], [2.85, -.5], [2.75, -.95], [2.45, -.9], [2.8, -.85], [3.05, -.95],
      [3.05, -.6], [3.05, -.2], [3.25, 0], [3.5, -.25], [3.6, -.75], [3.62, -1], [3.6, -.4], [3.7, -.05], [3.95, -.15], [4.15, -.75],
      [4.2, -1], [4.18, -.4], [4.3, -.05], [4.55, -.75], [4.68, -1], [4.82, -.75], [4.95, -.4], [5.1, -.08], [5.35, 0], [5.6, -.15]],
    [[5.25, -1.02], [4.95, -.5], [4.6, .02]],
    [[6.35, -.85], [6.1, -1.02], [5.8, -.85], [5.65, -.4], [5.8, -.05], [6.1, -.15], [6.35, -.75], [6.4, -1], [6.38, -.4], [6.5, -.05], [6.8, -.2]],
    [[1.8, -1.55], [1.83, -1.5]],
    [[4.22, -1.55], [4.25, -1.5]],
  ],
  majuscules: [...D, [[1.5, -2.02], [1.48, -1], [1.52, 0]],
    [[2, -2], [1.98, -1], [2, 0]], [[2, -2], [2.6, -1.92], [2.75, -1.45], [2.5, -1.05], [2, -1]], [[2.1, -1.02], [2.75, -.9], [2.92, -.45], [2.65, -.05], [2, 0]],
    [[3.3, -2], [3.28, -1.2], [3.3, -.6], [3.55, -.05], [3.95, -.05], [4.2, -.6], [4.22, -1.3], [4.2, -2]], [[4.65, -2], [4.67, -1], [4.65, 0]],
    [[5.05, -2], [5.5, -1.02], [6, 0]], [[6, -2], [5.55, -.98], [5.05, 0]], [[6.35, 0], [6.62, -1.05], [6.85, -2], [7.1, -.95], [7.35, 0]],
    [[6.55, -.75], [6.85, -.73], [7.15, -.77]]],
  impremta: [...D, [[1.5, -1], [1.51, 0]], [[1.5, -1.5], [1.52, -1.47]],
    [[1.95, -2], [1.94, -1], [1.95, 0]], [[1.95, -.6], [2.25, -1], [2.7, -.8], [2.75, -.3], [2.4, 0], [1.95, -.2]],
    [[3.15, -1], [3.15, -.35], [3.4, 0], [3.75, -.15], [3.9, -.6]], [[3.95, -1], [3.96, -.5], [3.95, 0]], [[4.4, -1], [4.41, 0]], [[4.4, -1.5], [4.42, -1.47]],
    [[4.8, -1], [5.15, -.5], [5.55, 0]], [[5.55, -1], [5.17, -.48], [4.8, 0]],
    [[6.55, -.75], [6.2, -1], [5.85, -.7], [5.85, -.25], [6.2, 0], [6.55, -.25]], [[6.6, -1], [6.61, -.5], [6.6, 0]]],
};

// the strokes smoothed (Catmull-Rom) and fitted: x from 0 to 1 across the word, y in the same unit, baseline at 0
export function handwriting(hand: Hand): Pt[][] {
  const slant = hand === 'lligada' ? .12 : .04;
  const smooth = ROUGH[hand].map(k => {
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
