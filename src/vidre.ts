// the mist on the window (vaho.ts), what is pure in it: what a touch on the glass is, and whether the first visit's
// words are due. Pure: the store is passed in, so scripts/test/ runs it
interface Store { getItem(k: string): string | null; setItem(k: string, v: string): void }
export interface Touch { x: number; y: number; t: number }   // where (px) and when (ms)

const KEY = 'capacasa.vaho';

// a tap: lifted within half a second (a long press is longer), less than 10 px from where it landed. Anything else scrolls the page, or was held
export const isTap = (a: Touch, b: Touch) => b.t - a.t < 500 && Math.hypot(b.x - a.x, b.y - a.y) < 10;

// the words wiped in the mist come once per browser (said in #privacitat). A store that keeps nothing (a private
// window, blocked site data) shows them every visit rather than never
export function hintDue(store: Store | null): boolean {
  try { if(store?.getItem(KEY)) return false; } catch { return true; }
  try { store?.setItem(KEY, '1'); } catch { /* not remembered */ }
  return true;
}

// what the words say, as if someone had written them on the glass: a finger taps, a mouse passes over
export const hintWords = (touch: boolean) => touch ? ['toca el vidre', 'i dibuixa'] : ['passa-hi', 'el ratolí'];
