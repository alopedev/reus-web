// the highlighted time says it can be pressed, «only if you hesitate» (option C, Àlex 12-10): raised like everything
// you can press until it is pressed for the first time; nothing moves on the way in; a touch where nothing answers
// makes it beat (with «›» on a phone, «compra’l» on a desktop). Once pressed it lies flat, as the train chosen, and
// stays so, also on the next visit (the browser remembers). Reduced motion keeps the relief only. The sweep of light
// that crossed it after 5 s without a touch was dropped (Àlex 12-10: the relief and the beat are enough)
// The beat comes out as a counter: each new beat is a new number, so the DOM restarts its animation

export interface Look { raised: boolean; beat: number }
type Store = Pick<Storage, 'getItem' | 'setItem'>;
interface Deps { store?: Store | null; still?: boolean }

const KEY = 'capacasa.hora';

function safeStore(): Store | null { try { return localStorage; } catch { return null; } }

export function createHint(onChange: (l: Look) => void, { store = safeStore(), still = false }: Deps = {}){
  // a browser that keeps nothing (a private window, blocked storage) gets the hint on every visit
  let pressed = false;
  try { pressed = store?.getItem(KEY) === '1'; } catch {}
  let beat = 0;
  const look = (): Look => ({ raised: !pressed, beat });
  return {
    look,
    // a touch where nothing answers
    miss(){
      if(pressed || still) return;
      beat++; onChange(look());
    },
    // the time (or its row) is pressed: understood
    press(){
      if(pressed) return;
      pressed = true; beat = 0;
      try { store?.setItem(KEY, '1'); } catch {}
      onChange(look());
    },
  };
}
export type Hint = ReturnType<typeof createHint>;
