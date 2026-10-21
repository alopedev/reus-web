import type { ViewState } from './state';
import { tomorrowAt } from './shown';

// what the visitor chooses on the hero, each control as one choice: the platform clock and «avui» (now), «demà», a trip
// of the board (on its own day), the ruler and its keys (on the day looked at), another town or station, the arrows.
// choose() says what the view becomes, so no control decides by itself what to forget. Pure: scripts/test/ runs it
export type Choice =
  | { kind: 'now' }
  | { kind: 'tomorrow' }
  | { kind: 'trip', minute: number, ave: boolean, day: string }
  | { kind: 'ruler', minute: number, ave: boolean }
  | { kind: 'town', id: string }
  | { kind: 'station', id: string }
  | { kind: 'swap' };

// tomorrow looked at: one of tomorrow's trains chosen (the same rule as `picked` in shown.ts)
const onTomorrow = (v: ViewState, today: string) => !v.useNow && !!v.day && v.day > today;

export function choose(v: ViewState, c: Choice, now: { date: string, min: number }): ViewState {
  switch(c.kind){
    case 'now': return { ...v, useNow: true, minute: null, day: null, ave: false };
    case 'tomorrow': return { ...v, useNow: false, ...tomorrowAt(now, v) };
    case 'trip': return { ...v, useNow: false, minute: c.minute, ave: c.ave, day: c.day };
    case 'ruler': return { ...v, useNow: false, minute: c.minute, ave: c.ave, day: onTomorrow(v, now.date) ? v.day : null };
    // a new town or station starts again from now, on the day looked at
    case 'town': case 'station': {
      const w = c.kind === 'town' ? { ...v, town: c.id } : { ...v, station: c.id };
      return onTomorrow(v, now.date) ? { ...w, useNow: false, ...tomorrowAt(now, w) } : { ...w, useNow: true, ave: false };
    }
    case 'swap': return { ...v, dir: v.dir === 'casa' ? 'bcn' : 'casa' };
  }
}
