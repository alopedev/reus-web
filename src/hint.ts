// the highlighted time says it can be pressed, «only if you hesitate» (option C, Àlex 12-10): raised like everything
// you can press until it is pressed for the first time; nothing moves on the way in; if nothing is touched 5 s after
// the hero comes in, a sweep of light crosses it once; a touch where nothing answers makes it beat (with «›» on a
// phone, «compra’l» on a desktop) and the light sweep it again. Once pressed it lies flat, as the train chosen, and
// all of it stops, also on the next visit (the browser remembers). Reduced motion keeps the relief only
// The page's look comes out as counters: each new sweep or beat is a new number, so the DOM restarts its animation

export interface Look { raised: boolean; shine: number; beat: number }
type Store = Pick<Storage, 'getItem' | 'setItem'>;
interface Deps { store?: Store | null; later?: (f: () => void, ms: number) => () => void; still?: boolean }

const KEY = 'capacasa.hora', IDLE = 5000;

function safeStore(): Store | null { try { return localStorage; } catch { return null; } }
const timer = (f: () => void, ms: number) => { const t = setTimeout(f, ms); return () => clearTimeout(t); };

export function createHint(onChange: (l: Look) => void, { store = safeStore(), later = timer, still = false }: Deps = {}){
  // a browser that keeps nothing (a private window, blocked storage) gets the hint on every visit
  let pressed = false;
  try { pressed = store?.getItem(KEY) === '1'; } catch {}
  let shine = 0, beat = 0, waited = false, cancel: (() => void) | null = null;
  const look = (): Look => ({ raised: !pressed, shine, beat });
  const stop = () => { cancel?.(); cancel = null; };
  const tell = () => onChange(look());
  return {
    look,
    // the hero has come in: the 5 s of doubt start, once
    enter(){
      if(pressed || still || waited) return;
      waited = true;
      cancel = later(() => { cancel = null; shine++; tell(); }, IDLE);
    },
    // a touch where nothing answers
    miss(){
      if(pressed || still) return;
      stop(); waited = true; shine++; beat++; tell();
    },
    // the time (or its row) is pressed: understood
    press(){
      if(pressed) return;
      stop(); pressed = true; shine = beat = 0;
      try { store?.setItem(KEY, '1'); } catch {}
      tell();
    },
  };
}
export type Hint = ReturnType<typeof createHint>;
