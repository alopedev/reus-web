import type { LineNews } from './notice';

// the lines' notices, as the Generalitat publishes them (09-10): api/avisos.ts reads its feeds, since the page cannot
// (no CORS). Three states per line, never two: a notice, normal (checked at a time), or unknown. Unknown shows
// nothing on the board and says so in a phone's sheet, so a silence is never taken for «all is well»
export type Line = { estat: 'avis', text: string, publicat: string | null } | { estat: 'normal' } | { estat: 'error' };
export interface Answer { llegit: string, linies: Record<string, Line> }

const URL_ = '/api/avisos';
const FRESH = 2*60e3, WAIT = 6000, OLD = 30*60e3;   // an answer read more than half an hour ago is not shown

// follow() asks when the last answer is older than FRESH; onChange runs when what is known changes. line(l) is
// what is known of a line: undefined before the first answer, 'error' when the function cannot be reached
export function createAvisos(onChange: () => void){
  let known: Answer | null = null, failed = false, asked = 0, pending = false, seen = '';
  async function ask(){
    pending = true; asked = Date.now();
    let got: Answer | null = null;
    try {
      const res = await fetch(URL_, { signal: AbortSignal.timeout(WAIT), cache: 'no-store' });
      const body = res.ok ? await res.json() as Answer : null;
      if(body?.linies && Date.now() - Date.parse(body.llegit) < OLD) got = body;
    } catch { /* no answer: unknown */ }
    // a failed ask keeps the last answer while it is still fresh enough to show, so one bad minute does not blink
    if(!got && known && Date.now() - Date.parse(known.llegit) < OLD) got = known;
    pending = false; known = got; failed = !got;
    const now = JSON.stringify([failed, known?.linies]);
    if(now !== seen){ seen = now; onChange(); }
  }
  return {
    follow(){ if(!pending && Date.now() - asked > FRESH) void ask(); },
    line(l: string): Line | { estat: 'error' } | undefined {
      if(failed) return { estat: 'error' };
      return known ? known.linies[l] ?? { estat: 'error' } : undefined;
    },
    read: () => known?.llegit ?? null,
    now: () => failed ? 'error' : known ? known.linies : null,   // check.py reads it
  };
}
export type Avisos = ReturnType<typeof createAvisos>;

// what the train's sheet says of its line: the AVE has no notices; before the first answer, it is being asked
export function lineNews(avisos: Pick<Avisos, 'line' | 'read'>, line: string, isAve: boolean): LineNews {
  if(isAve) return { kind: 'ave' };
  const n = avisos.line(line), read = avisos.read();
  if(!n) return { kind: 'pending', line };
  if(n.estat === 'avis' && read) return { kind: 'avis', line, text: n.text, read };
  if(n.estat === 'normal' && read) return { kind: 'normal', line, read };
  return { kind: 'error', line };
}

// a notice in a few words for the stamp, from what it says; «mira’l» when none fits
const GIST: [RegExp, string][] = [
  [/per carretera/i, 'per carretera'],
  [/sense servei|interromput|suspès/i, 'sense servei'],
  [/via única/i, 'via única'],
  [/retard|demor/i, 'amb retards'],
  [/restablert|restablerta/i, 'restablert'],
];
export const gist = (text: string): string => GIST.find(([re]) => re.test(text))?.[1] ?? 'mira’l';
