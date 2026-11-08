// the town chooser's search (option B, Àlex 08-11): what is typed, read the forgiving way. Every word typed must
// start a word of the town's name, with no accents or capitals needed («mora» finds Móra la Nova, «hospitalet»
// L'Hospitalet de l'Infant, «sant cel» Sant Celoni). The names that start with what is typed come first, then the
// rest, each in Catalan alphabetical order. Pure: `npm test` (find.test.ts)

export interface Findable { id: string; name: string }

// lower case, no accents, the apostrophe, the hyphen and the middle dot read as spaces between words
const fold = (s: string): string => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[’'\-·.]/g, ' ');
const words = (s: string): string[] => fold(s).split(/\s+/).filter(Boolean);

export function find<T extends Findable>(query: string, towns: readonly T[]): T[] {
  const want = words(query);
  if(!want.length) return [];
  const hits = towns.filter(t => { const has = words(t.name); return want.every(w => has.some(h => h.startsWith(w))); });
  const first = (t: T): boolean => fold(t.name).replace(/\s+/g, ' ').trim().startsWith(want.join(' '));
  return hits.sort((a, b) => Number(first(b)) - Number(first(a)) || a.name.localeCompare(b.name, 'ca'));
}

// where what was typed sits in a name found, to set it in bold: for each word typed, the first word of the name it
// starts, as [from, to) in the name's own characters (folding keeps one character per character)
export function marks(name: string, query: string): [number, number][] {
  const flat = [...name].map(c => fold(c)[0] ?? ' ').join('');
  const starts = [...flat.matchAll(/\S+/g)].map(m => m.index!);
  const used = new Set<number>(), out: [number, number][] = [];
  for(const w of words(query)){
    const at = starts.find(i => !used.has(i) && flat.startsWith(w, i));
    if(at !== undefined){ used.add(at); out.push([at, at + w.length]); }
  }
  return out.sort((a, b) => a[0] - b[0]);
}
