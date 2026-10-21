// what the page keeps asking a source for while it is open (20-10): the lines' notices, the live delays and the
// weather at home. One way of asking for all three: at most every `fresh` ms, and again on its own when that time
// comes (the board is redrawn once a minute, and the delays are worth asking every 30 s); not while the tab is
// hidden (its next redraw asks); a failed ask keeps the last answer while it is still `usable`. A source may follow a
// key (the weather, a town): another key forgets what was known, and an answer for a key left behind is dropped.
// The tests (scripts/test/) hand it their own ask, clock and timer

export type Ask<K> = (key: K) => Promise<unknown>;
export type Wait = (fn: () => void, ms: number) => () => void;

export interface LiveOptions<A, K> {
  ask: Ask<K>;
  fresh: number;
  // an answer worth showing, at that time
  usable: (body: unknown, now: number) => body is A;
  // what of an answer, when it changes, is worth telling (by default all of it)
  sign?: (a: A) => unknown;
  clock?: () => number;
  wait?: Wait;
  hidden?: () => boolean;
}

const later: Wait = (fn, ms) => { const id = setTimeout(fn, ms); return () => clearTimeout(id); };
const tabHidden = () => typeof document !== 'undefined' && document.hidden;

// follow(key) asks when the key changes or the last ask is older than `fresh`; onChange runs when what is known
// changes. answer() is the last usable answer for the key followed, or null; answered() is false until the first
export function createLive<A, K = string>(onChange: () => void, o: LiveOptions<A, K>){
  const { ask, fresh, usable, sign = (a: A) => a, clock = Date.now, wait = later, hidden = tabHidden } = o;
  let key: K | undefined, known: A | null = null, answered = false, asked = -Infinity, pending = false, req = 0;
  let seen = JSON.stringify([false, null]);   // nothing known yet is no change: the page starts that way
  let cancel = () => {};
  const answer = (): A | null => known && usable(known, clock()) ? known : null;
  function tell(){
    const a = answer(), now = JSON.stringify([answered, a === null ? null : sign(a)]);
    if(now !== seen){ seen = now; onChange(); }
  }
  async function update(){
    const mine = ++req, k = key as K;
    pending = true; asked = clock(); cancel();
    const body = await ask(k);
    if(mine !== req) return;   // another key meanwhile: its own answer will tell
    if(usable(body, clock())) known = body;
    else if(!answer()) known = null;
    pending = false; answered = true;
    cancel = wait(() => { if(k === key && !hidden()) follow(k); }, fresh + 1);
    tell();
  }
  function follow(k: K){
    if(k !== key){ key = k; known = null; answered = false; tell(); void update(); }
    else if(!pending && clock() - asked > fresh) void update();
  }
  return { follow, answer, answered: () => answered };
}
