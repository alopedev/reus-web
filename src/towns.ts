import { NET, PATTERNS, SANTS, CAMP, VILAFANT } from './time';

// each line's colour, as Renfe paints it (shared by the board and the chooser)
// Rodalies' line colours; R13 and R15 a shade darker and R17 in ink letters, so every pill reads at 4.5:1 (11-10).
// The other Rodalies lines (08-11) the same way: R1, R2 and R2 Sud a shade darker, R2 Nord and R4 in ink letters
export const LINE: Record<string, string> = { R11:'#0064A7', R13:'#DD1B78', R14:'#6A2C91', R15:'#8C6F52', R16:'#B8114E', R17:'#F39700',
  R1:'#377C9C', R2:'#1E8632', R2N:'#D0DF00', R2S:'#146520', R4:'#F7A30D' };
const INK: Record<string, string> = { R17:'#2D241C', R2N:'#2D241C', R4:'#2D241C' };
// a pill's colours, as CSS variables: --c its colour, --t its letters (the fast trains, AV, and any unknown line in ink)
export const lineStyle = (l: string): string => `--c:${LINE[l] ?? 'var(--shadow)'};--t:${INK[l] ?? '#FFFFFF'}`;

// out of the chooser: Barcelona's own stations (their own picker is 3.5), the airport (nobody lives there), Camp de
// Tarragona and Figueres-Vilafant (fast trains only, no regional line of its own). El Prat de Llobregat and Bellvitge
// were left out while the site had only the regionals; with every Rodalies line (Àlex, 08-11: anyone who lives in
// Catalonia) they are towns like the rest. Everything else with a direct train from a `barcelona` station and one back
// is a town: a station reached one way only (Cerbère, 12-10: ten trains out, none back) would leave half the ticket empty
const EXCLUDE = new Set(['72400', CAMP, VILAFANT]);
// the trains the chooser reads: the regionals and fast trains, and one per stopping pattern of the other Rodalies
// lines, whose own trains only come with the town (time.ts addPart)
const SHAPES = [...NET.trenes, ...PATTERNS];
const bcnIds = new Set(Object.keys(NET.estaciones).filter(id => NET.estaciones[id].barcelona));
const fromBcn = new Set<string>(), toBcn = new Set<string>();
for(const t of SHAPES){
  const ids = t.s.map(s => s[0]), at = ids.flatMap((id, i) => bcnIds.has(id) ? [i] : []);
  if(!at.length) continue;
  ids.slice(at[at.length - 1] + 1).forEach(id => fromBcn.add(id));
  ids.slice(0, at[0]).forEach(id => toBcn.add(id));
}
const isTown = (id: string, st: {barcelona?: boolean}): boolean => !st.barcelona && !EXCLUDE.has(id) && fromBcn.has(id) && toBcn.has(id);

// the fastest direct trip from Barcelona-Sants to a station, across every train that reaches it: the tie-break
// for the topological merge below (decision 4 of spec-3.3). Worked out once per station
const fastest = new Map<string, number>();
function fastestFromSants(id: string): number {
  let best = fastest.get(id);
  if(best !== undefined) return best;
  best = Infinity;
  for(const t of SHAPES){
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
function lineOrder(line: string): { order: string[], side: Map<string, number> } {
  const edges = new Map<string, Set<string>>(), nodes = new Set<string>();
  for(const t of SHAPES){
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
  // a line that crosses Barcelona (the R4: Martorell and Sant Vicenç on one side, Terrassa and Manresa on the other)
  // has two runs with no train between them: each side whole, the side with more towns first, never one town from
  // each in turn (08-11)
  const side = new Map<string, number>();
  const near = new Map<string, Set<string>>();
  for(const [a, tos] of edges) for(const b of tos){ (near.get(a) ?? near.set(a, new Set()).get(a)!).add(b); (near.get(b) ?? near.set(b, new Set()).get(b)!).add(a); }
  let sides = 0;
  for(const n of nodes){
    if(side.has(n)) continue;
    const todo = [n]; side.set(n, sides);
    while(todo.length) for(const m of near.get(todo.pop()!) ?? []) if(!side.has(m)){ side.set(m, sides); todo.push(m); }
    sides++;
  }
  const size = (n: string) => [...side.values()].filter(x => x === side.get(n)).length;
  const all = [...order, ...left];
  return { side, order: all.map((n, i) => ({ n, i })).sort((a, b) => size(b.n) - size(a.n) || side.get(a.n)! - side.get(b.n)! || a.i - b.i).map(x => x.n) };
}

// `side`: on a line that crosses Barcelona, which side of it (0 the first listed); the strip breaks its rail between two
export interface Town { id: string; name: string; line: string; side: number }
// a town as the search finds it (find.ts): every line that serves it and its comarca, said under its name
export interface Place { id: string; name: string; lines: string[]; comarca: string }
export interface Group { key: string; label: string; lines: string[]; towns: Town[] }

const name = (id: string): string => NET.estaciones[id].nombre;
// the four corridors of the first step, in this order (decision 5 of spec-3.3): each is the main line's towns,
// in line order, then -- as a branch -- the towns only the second line reaches, in its own line order
function group(key: string, label: string, main: string, branch?: string): Group {
  const { order: mainOrder, side } = lineOrder(main);
  const sides = [...new Set(mainOrder.map(id => side.get(id)!))];
  const branchOrder = branch ? lineOrder(branch).order.filter(id => !mainOrder.includes(id)) : [];
  return { key, label, lines: branch ? [main, branch] : [main],
    towns: [...mainOrder.map(id => ({ id, name: name(id), line: main, side: sides.indexOf(side.get(id)!) })),
      ...branchOrder.map(id => ({ id, name: name(id), line: branch!, side: 0 }))] };
}
export const GROUPS: Group[] = [
  group('R11', 'Girona · Figueres · Portbou', 'R11'),
  group('R13', 'Valls · Montblanc · Lleida', 'R13'),
  group('R14', 'Tarragona · Reus · Falset · Móra la Nova', 'R15', 'R14'),
  group('R16', 'Tarragona · Salou · Cambrils · Tortosa', 'R16', 'R17'),
  group('R1', 'Maresme · Mataró · Blanes', 'R1'),
  group('R2', 'Granollers · Castelldefels · Vilanova', 'R2', 'R2N'),
  group('R2S', 'Garraf · Sitges · Sant Vicenç', 'R2S'),
  group('R4', 'Terrassa · Manresa · Martorell', 'R4'),
].filter(g => g.towns.length);

// the order of lines on a pill row: by number (R2 before R13), then R2, R2N, R2S
const byNumber = (a: string, b: string) => parseInt(a.slice(1)) - parseInt(b.slice(1)) || a.localeCompare(b);
// the lines with a direct train between a Barcelona station and a town, either way, for the station sheet (chooser.ts);
// the fast trains (AV) are said apart, with the town's other station
export const stationLines = (station: string, town: string): string[] => [...new Set(SHAPES.filter(t => t.p in LINE
  && t.s.some(x => x[0] === station) && t.s.some(x => x[0] === town)).map(t => t.p))].sort(byNumber);

// every town the chooser offers, once, for the search: its lines in number order (R13 before R17) and its comarca
export const TOWNS: Place[] = [...new Map(GROUPS.flatMap(g => g.towns).map(t => [t.id, t])).values()].map(t => ({
  id: t.id, name: t.name, comarca: NET.estaciones[t.id].comarca ?? '',
  lines: (NET.estaciones[t.id].lineas ?? []).filter(l => l in LINE).sort(byNumber) }));
