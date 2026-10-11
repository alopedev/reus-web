// Capacasa without a connection (06-10): in a tunnel or out of coverage the site still opens, with the timetable
// it was built with (14 days, inside the script). Built by vite.config.js, which fills in the files of this build
const FILES = self.__FILES__;                  // the fonts too: since 11-10 they come with the build
const SITE = 'capacasa-' + self.__VERSION__;   // one cache per build: a new build drops the old one
const WAIT_MS = 3000;   // a page on a flaky connection waits this long for the network before opening the saved one

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    await (await caches.open(SITE)).addAll(['./', ...FILES]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // the old builds, and Google's fonts that a visit from before 11-10 kept in 'capacasa-fuentes'
    for(const key of await caches.keys()) if(key.startsWith('capacasa-') && key !== SITE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(req.mode === 'navigate') e.respondWith(page(req));
  else if(url.origin === location.origin && FILES.includes(url.pathname)) e.respondWith(saved(req));
  // everything else goes to the network untouched: the weather, /api/avisos and /api/retards are never saved, an old notice is worse
  // than none
});

// the page: the network first, so a new timetable arrives as soon as it is published; the saved one if the network
// fails or is too slow
async function page(req){
  const cache = await caches.open(SITE);
  const net = fetch(req).then(res => { if(res.ok) cache.put('./', res.clone()); return res; });
  net.catch(() => {});   // a late failure after the saved page was given is nobody's business
  const late = new Promise(ok => setTimeout(ok, WAIT_MS));
  try {
    const first = await Promise.race([net, late]);
    if(first) return first;
    return (await cache.match('./')) || await net;
  } catch {
    const kept = await cache.match('./');
    if(kept) return kept;
    throw new Error('offline and nothing saved');
  }
}

// a build's scripts and styles never change under the same name
async function saved(req){
  return (await caches.match(req)) || fetch(req);
}
