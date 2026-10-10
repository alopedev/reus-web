// Capacasa without a connection (06-10): in a tunnel or out of coverage the site still opens, with the timetable
// it was built with (14 days, inside the script). Built by vite.config.js, which fills in the files of this build
const FILES = self.__FILES__;
const SITE = 'capacasa-' + self.__VERSION__;   // one cache per build: a new build drops the old one
const FONTS = 'capacasa-fuentes';              // Google Fonts change seldom: they outlive builds
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const WAIT_MS = 3000;   // a page on a flaky connection waits this long for the network before opening the saved one

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    await (await caches.open(SITE)).addAll(['./', ...FILES]);
    await saveFonts().catch(() => {});   // without them the site still opens, in the fallback fonts
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for(const key of await caches.keys()) if(key.startsWith('capacasa-') && key !== SITE && key !== FONTS) await caches.delete(key);
    await self.clients.claim();
  })());
});

// the stylesheet the page links to and the font files it names: the first visit loaded them before this worker
// was there, so they are fetched once more to keep them
async function saveFonts(){
  const page = await (await caches.open(SITE)).match('./');
  const css = page && (await page.text()).match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/);
  if(!css) return;
  const url = css[1].replace(/&amp;/g, '&');
  const cache = await caches.open(FONTS);
  const sheet = await fetch(url);
  if(!sheet.ok) return;
  await cache.put(url, sheet.clone());
  // two weights of a variable font are one file named twice (Karla 500/700 did it): addAll refuses duplicates
  const files = [...new Set([...(await sheet.text()).matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]))];
  await cache.addAll(files);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(req.mode === 'navigate') e.respondWith(page(req));
  else if(url.origin === location.origin && FILES.includes(url.pathname)) e.respondWith(saved(req));
  else if(FONT_HOSTS.includes(url.hostname)) e.respondWith(font(req));
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

// fonts: the saved copy at once, refreshed in the background
async function font(req){
  const cache = await caches.open(FONTS);
  const kept = await cache.match(req.url);
  const net = fetch(req).then(res => { if(res.ok || res.type === 'opaque') cache.put(req.url, res.clone()); return res; });
  if(kept){ net.catch(() => {}); return kept; }
  return net;
}
