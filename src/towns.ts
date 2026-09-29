import { NET, SANTS, CAMP } from './time';

// each line's colour, as Renfe paints it (shared by the board and the chooser)
export const LINE: Record<string, string> = { R11:'#0064A7', R13:'#E52782', R14:'#6A2C91', R15:'#9B7B5A', R16:'#B8114E', R17:'#F39700' };

// out of the chooser: Barcelona's own stations (their own picker is 3.5), the two dense commuter stops nearest
// Barcelona (El Prat de Llobregat, El Prat Aeroport, Bellvitge - Gornal) and Camp de Tarragona (AVE only, no
// regional line of its own). Everything else with a direct train to a `barcelona` station is a town
const EXCLUDE = new Set(['71707', '72400', '71708', CAMP]);
const isTown = (id: string, st: {barcelona?: boolean}): boolean => !st.barcelona && !EXCLUDE.has(id);
const bcnIds = new Set(Object.keys(NET.estaciones).filter(id => NET.estaciones[id].barcelona));

// the fastest direct trip from Barcelona-Sants to a station, across every train that reaches it: the tie-break
// for the topological merge below (decision 4 of spec-3.3). Worked out once per station
const fastest = new Map<string, number>();
function fastestFromSants(id: string): number {
  let best = fastest.get(id);
  if(best !== undefined) return best;
  best = Infinity;
  for(const t of NET.trenes){
    const a = t.s.findIndex(x => x[0] === SANTS), b = t.s.findIndex(x => x[0] === id);
    if(a >= 0 && b > a) best = Math.min(best, t.s[b][1] - t.s[a][2]);
  }
  fastest.set(id, best);
  return best;
}

// a train's stops as runs outward from Barcelona, restricted to eligible towns: what comes after its last
// Barcelona stop, and what comes before its first one read backwards (a train that crosses the city, El Prat →
// Sants → Girona, gives both sides; one that ends in Barcelona is read from there). No Barcelona stop, no run
function outward(train: { s: [string, number, number][] }): string[][] {
  const ids = train.s.map(s => s[0]);
  const first = ids.findIndex(id => bcnIds.has(id)), last = ids.length - 1 - [...ids].reverse().findIndex(id => bcnIds.has(id));
  if(first < 0) return [];
  const towns = (seq: string[]) => seq.filter(id => isTown(id, NET.estaciones[id] ?? {}));
  return [towns(ids.slice(last + 1)), towns(ids.slice(0, first).reverse())];
}

// the towns a line serves, Barcelona → outward: a topological merge of every train's outward stop sequence
// (a town always keeps its place relative to the towns its own trains pass before and after it), ties broken
// by the fastest trip from Sants. Kahn's algorithm over the "comes before" edges built from consecutive stops
function lineOrder(line: string): string[] {
  const edges = new Map<string, Set<string>>(), nodes = new Set<string>();
  for(const t of NET.trenes){
    if(t.p !== line) continue;
    for(const seq of outward(t)){
      for(const id of seq) nodes.add(id);
      for(let i = 0; i < seq.length - 1; i++){
        const [a, b] = [seq[i], seq[i + 1]]; if(a === b) continue;
        let s = edges.get(a); if(!s) edges.set(a, s = new Set()); s.add(b);
      }
    }
  }
  const indeg = new Map<string, number>([...nodes].map(n => [n, 0]));
  for(const [, tos] of edges) for(const b of tos) indeg.set(b, (indeg.get(b) ?? 0) + 1);
  const order: string[] = [];
  const ready = [...nodes].filter(n => indeg.get(n) === 0);
  while(ready.length){
    ready.sort((a, b) => fastestFromSants(a) - fastestFromSants(b));
    const n = ready.shift()!; order.push(n);
    for(const b of edges.get(n) ?? []){ const d = indeg.get(b)! - 1; indeg.set(b, d); if(d === 0) ready.push(b); }
  }
  // a cycle (two trains disagreeing on the order) would leave towns out: they go last, by the fastest trip, and
  // never disappear from the chooser
  const left = [...nodes].filter(n => !order.includes(n)).sort((a, b) => fastestFromSants(a) - fastestFromSants(b));
  return [...order, ...left];
}

export interface Town { id: string; name: string; line: string }
export interface Group { key: string; label: string; lines: string[]; towns: Town[] }

const name = (id: string): string => NET.estaciones[id].nombre;
// the four corridors of the first step, in this order (decision 5 of spec-3.3): each is the main line's towns,
// in line order, then -- as a branch -- the towns only the second line reaches, in its own line order
function group(key: string, label: string, main: string, branch?: string): Group {
  const mainOrder = lineOrder(main);
  const branchOrder = branch ? lineOrder(branch).filter(id => !mainOrder.includes(id)) : [];
  return { key, label, lines: branch ? [main, branch] : [main],
    towns: [...mainOrder.map(id => ({ id, name: name(id), line: main })), ...branchOrder.map(id => ({ id, name: name(id), line: branch! }))] };
}
export const GROUPS: Group[] = [
  group('R11', 'Girona · Figueres · Portbou', 'R11'),
  group('R13', 'Valls · Montblanc · Lleida', 'R13'),
  group('R14', 'Tarragona · Reus · Falset · Móra la Nova', 'R15', 'R14'),
  group('R16', 'Tarragona · Salou · Cambrils · Tortosa', 'R16', 'R17'),
];
