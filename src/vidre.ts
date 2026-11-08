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
