// the live delays (10-10): api/retards.ts reads Renfe's real-time feeds, since the page cannot (no CORS), and answers
// per train number. What the page knows of a train is one of four things, never two: running (late, on time or
// early), cancelled, not in Renfe's feed (a train enters it only once it runs), or unknown (the function could not be
// reached, or its answer is old). Unknown is never taken for «on time»
export type Train = { estat: 'circula', retard: number, parada: string, andana?: string } | { estat: 'cancelat' };
export interface Answer { llegit: string, trens: Record<string, Train> }

const FRESH = 30e3, WAIT = 6000, OLD = 3*60e3;   // Renfe rewrites every 20 s and the CDN keeps 40 s at most: 3 min is a broken feed

export type Ask = () => Promise<unknown>;
const askFunction: Ask = async () => {
  try {
    const res = await fetch('/api/retards', { signal: AbortSignal.timeout(WAIT), cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch { return null; }
};

// red.json writes most trains by their number («17505») and the R11 by their whole GTFS id («5191M15918R11»)
const number = (n: string): string => n.match(/^\d{4}[A-Z](\d+)[A-Z]/)?.[1] ?? n;

// an answer worth showing: the function's shape, read less than 3 minutes ago
const usable = (body: unknown, now: number): body is Answer => {
  const a = body as Answer | null;
  return !!a?.trens && typeof a.llegit === 'string' && now - Date.parse(a.llegit) < OLD;
};

export type Known = Train | { estat: 'sense' } | { estat: 'error' };

// follow() asks when the last ask is older than FRESH; onChange runs when what is known changes
export function createRetards(onChange: () => void, { ask = askFunction, clock = Date.now }: { ask?: Ask, clock?: () => number } = {}){
  let known: Answer | null = null, asked = -Infinity, answered = false, pending = false, seen = '';
  async function update(){
    pending = true; asked = clock();
    const body = await ask();
    // a failed ask keeps the last answer while it is fresh, so one bad moment does not blink
    if(usable(body, clock())) known = body;
    else if(known && !usable(known, clock())) known = null;
    pending = false; answered = true;
    const now = JSON.stringify(known?.trens ?? null);
    if(now !== seen){ seen = now; onChange(); }
  }
  return {
    follow(){ if(!pending && clock() - asked > FRESH) void update(); },
    // undefined before the first answer; then what the last answer says of it, while it is fresh
    train(n: string): Known | undefined {
      if(!answered) return undefined;
      if(!known || !usable(known, clock())) return { estat: 'error' };
      return known.trens[number(n)] ?? { estat: 'sense' };
    },
  };
}
export type Retards = ReturnType<typeof createRetards>;
