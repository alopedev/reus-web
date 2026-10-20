// the live delays (10-10): api/retards.ts reads Renfe's real-time feeds, since the page cannot (no CORS), and answers
// per train number. What the page knows of a train is one of four things, never two: running (late, on time or
// early), cancelled, not in Renfe's feed (a train enters it only once it runs), or unknown (the function could not be
// reached, or its answer is old). Unknown is never taken for «on time»
import { createLive, type LiveOptions } from './live';

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

// follow() asks at most every 30 s (live.ts); onChange runs when what is known changes
export function createRetards(onChange: () => void, o: Omit<Partial<LiveOptions<Answer, ''>>, 'ask'> & { ask?: Ask } = {}){
  const { ask = askFunction, ...rest } = o;
  const live = createLive<Answer, ''>(onChange, { fresh: FRESH, usable, sign: a => a.trens, ...rest, ask: () => ask() });
  return {
    follow: () => live.follow(''),
    // undefined before the first answer; then what the last answer says of it, while it is fresh
    train(n: string): Known | undefined {
      if(!live.answered()) return undefined;
      const a = live.answer();
      return a ? a.trens[number(n)] ?? { estat: 'sense' } : { estat: 'error' };
    },
  };
}
export type Retards = ReturnType<typeof createRetards>;
