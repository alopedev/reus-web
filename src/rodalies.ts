import { RODALIES_FILES, addPart } from './time';
import type { Part } from './split';

// a Rodalies town's trains (split.ts) are fetched when the town is chosen, or when it comes back from the last visit,
// and join the network (addPart). Each file is asked for once, even when two parts of the page ask at once; a failure
// (no connection, and no copy kept by the worker) is remembered so the board can say so, and the next try asks again.
// The request is passed in by the tests
type Get = (url: string) => Promise<Part>;
const fromNetwork: Get = async url => {
  const res = await fetch(url);
  if(!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json() as Promise<Part>;
};

export interface Parts {
  // true while the town's trains are on their way: the board waits, rather than say there is no train
  waiting(id: string): boolean;
  // true if the last try failed
  failed(id: string): boolean;
  // fetch the town's trains if it has any and they are not in yet; true if trains were added
  load(id: string): Promise<boolean>;
}

export function createParts(get: Get = fromNetwork, files: Record<string, string> = RODALIES_FILES): Parts {
  const asking = new Map<string, Promise<boolean>>(), done = new Set<string>(), failed = new Set<string>();
  return {
    waiting: id => id in files && !done.has(id) && !failed.has(id),
    failed: id => failed.has(id),
    load(id){
      if(!(id in files) || done.has(id)) return Promise.resolve(false);
      let p = asking.get(id);
      if(!p){
        failed.delete(id);
        p = get('/assets/' + files[id]).then(part => { done.add(id); return addPart(part); },
          () => { failed.add(id); return false; }).finally(() => asking.delete(id));
        asking.set(id, p);
      }
      return p;
    },
  };
}
