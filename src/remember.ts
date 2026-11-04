import { BCN } from './time';
import { GROUPS } from './towns';
import type { ViewState } from './state';

// the trip comes back on the next visit (Àlex 04-11, point 2 of the UX review): the town, the Barcelona station and
// the direction last chosen, kept in this browser only (no cookie, nothing sent; said in #privacitat). Only what the
// timetable still offers comes back; a store that is missing, blocked or full gives the defaults. Pure: the store is
// passed in, so scripts/test/ runs it
type Trip = Pick<ViewState, 'dir' | 'town' | 'station'>;
interface Store { getItem(k: string): string | null; setItem(k: string, v: string): void }

const KEY = 'capacasa.viatge';
const towns = new Set(GROUPS.flatMap(g => g.towns.map(t => t.id)));
const stations = new Set(BCN.map(s => s.id));

export function recall(store: Store | null): Partial<Trip> {
  let raw: unknown;
  try { raw = JSON.parse(store?.getItem(KEY) ?? 'null'); } catch { return {}; }
  if(!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const {dir, town, station} = raw as Record<string, unknown>;
  const out: Partial<Trip> = {};
  if(dir === 'casa' || dir === 'bcn') out.dir = dir;
  if(typeof town === 'string' && towns.has(town)) out.town = town;
  if(typeof station === 'string' && stations.has(station)) out.station = station;
  return out;
}

export function keep(store: Store | null, {dir, town, station}: Trip): void {
  try { store?.setItem(KEY, JSON.stringify({dir, town, station})); } catch { /* a private window or a full store: not remembered */ }
}

// the browser's store, or none when even asking for it throws (blocked site data)
export function browserStore(): Store | null { try { return localStorage; } catch { return null; } }
