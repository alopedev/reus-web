import type { NetTrain, Network } from './time';

// data/rodalies.json (every other Rodalies line, contract in docs/referencias/datos-red-contrato.md) is 80 kB with
// gzip: too much for every visit. The build (vite.config.js) cuts it in two. The index goes with the page: every
// station, and one train per stopping pattern, with no days, enough for the town chooser to know each line's towns
// and their order. Each town gets a file of its own with every train that stops there and the days it runs (indices
// into its own `t`), fetched only when that town is chosen (addPart in time.ts). Barcelona's own stations get none:
// a trip always has a town at the other end. Pure: the tests split the frozen timetable the same way
export interface RodaliesIndex { estaciones: Network['estaciones']; patrons: NetTrain[] }
export interface Part { t: NetTrain[]; dias: Record<string, number[]> }

const shape = (t: NetTrain): string => t.p + ':' + t.s.map(x => x[0]).join(',');

export function split(rod: Network): { index: RodaliesIndex, towns: Record<string, Part> } {
  const seen = new Set<string>(), patrons: NetTrain[] = [];
  for(const t of rod.trenes){ const k = shape(t); if(!seen.has(k)){ seen.add(k); patrons.push(t); } }
  const runs = rod.trenes.map(() => [] as string[]);
  for(const [day, ids] of Object.entries(rod.dias)) for(const i of ids) runs[i]?.push(day);
  const towns: Record<string, Part> = {};
  for(const id of Object.keys(rod.estaciones)){
    if(rod.estaciones[id].barcelona) continue;
    const part: Part = { t: [], dias: {} };
    rod.trenes.forEach((t, i) => {
      if(!t.s.some(x => x[0] === id)) return;
      const j = part.t.push(t) - 1;
      for(const day of runs[i]) (part.dias[day] ??= []).push(j);
    });
    if(part.t.length) towns[id] = part;
  }
  return { index: { estaciones: rod.estaciones, patrons }, towns };
}
