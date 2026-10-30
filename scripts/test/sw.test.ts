// the offline worker (src/sw.js) as a browser runs it, with a network and a cache of the test's own. `npm test`, no
// browser: check.py sinred keeps the real thing (a visit, then the page again without a connection)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const FILES = ['/assets/index-AAAA.js', '/assets/vendor-VVVV.js', '/assets/index-CCCC.css'];
const page = (js: string) => `<!doctype html><script type="module" crossorigin src="/assets/${js}.js"></script>` +
  `<link rel="modulepreload" crossorigin href="/assets/vendor-VVVV.js"><link rel="stylesheet" href="/assets/index-CCCC.css">`;

// the worker built with FILES, fetching `net` for the page; what it puts in its cache goes to `kept`
function worker(net: string){
  const listeners: Record<string, (e: unknown) => void> = {}, kept = new Map<string, string>();
  const cache = { put: async (k: string, r: Response) => { kept.set(k, await r.text()); }, match: async () => undefined };
  const self = { addEventListener: (type: string, fn: (e: unknown) => void) => { listeners[type] = fn; }, skipWaiting() {}, clients: { claim() {} } };
  const source = readFileSync('src/sw.js', 'utf8').replace('self.__FILES__', JSON.stringify(FILES)).replace('self.__VERSION__', '"v1"');
  runInNewContext(source, { self, caches: { open: async () => cache, keys: async () => [], match: async () => undefined },
    fetch: async () => new Response(net), location: { origin: 'https://capacasa.alope.dev' }, URL, Response, Promise, setTimeout });
  // a visit: the worker answers the page, and the test waits until it is done with it
  async function visit(){
    let answer: Promise<Response> | undefined;
    listeners.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://capacasa.alope.dev/' }, respondWith: (p: Promise<Response>) => { answer = p; } });
    const text = await (await answer!).text();
    await new Promise(r => setTimeout(r, 10));
    return text;
  }
  return { visit, kept };
}

test('a page of its own build is kept, so the site opens again without a connection', async () => {
  const w = worker(page('index-AAAA'));
  assert.equal(await w.visit(), page('index-AAAA'));
  assert.equal(w.kept.get('./'), page('index-AAAA'));
});

test('a page of a newer build is shown but not kept: offline, it would ask for a script this worker does not have', async () => {
  const w = worker(page('index-BBBB'));
  assert.equal(await w.visit(), page('index-BBBB'));
  assert.equal(w.kept.has('./'), false);
});

test('nor a newer build\'s page that only changed its styles', async () => {
  const w = worker(page('index-AAAA').replace('index-CCCC.css', 'index-DDDD.css'));
  await w.visit();
  assert.equal(w.kept.has('./'), false);
});
