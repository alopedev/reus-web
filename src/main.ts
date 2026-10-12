import './styles/fonts.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/table.css';
import './styles/letters.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { build3D } from './world';
import { createTable } from './table';
import { createScenery } from './scenery';
import { createFlaps } from './flaps';
import { setupTimetable } from './timetable';
import { setupShelf, dropped, hingeAt } from './shelf';
import { pair, state } from './letters';
import { daylight } from './light';
import { createWeather } from './weather';
import { createAvisos } from './avisos';
import { createRetards } from './retards';
import { setupPrivacy } from './privacy';
import { counted } from './visites';
import { createHint, type Look } from './hint';
import { reduce } from './state';
import { byId } from './dom';

// the page always opens on the hero: the browser must not put back the last visit's scroll (Safari does on a reload
// or a reopened tab). The native API, not ScrollTrigger.clearScrollMemory(): ScrollTrigger is only registered later,
// in setupShelf, and calling it before stops the whole page from starting
if('scrollRestoration' in history) history.scrollRestoration = 'manual';
// nor jump to an anchor: «Què és i com s’ha fet» used to leave #repisa in the address, and reopening the site from
// the history or the address bar's suggestions landed on the table (Safari shows only the domain, so it was unseen)
if(location.hash){
  history.replaceState(null, '', location.pathname + location.search);
  addEventListener('load', () => scrollTo({top: 0, behavior: 'instant'}), {once: true});
}
scrollTo({top: 0, behavior: 'instant'});

const world = build3D();
const table = createTable();
const flaps = createFlaps(world ? r => world.snap(r) : undefined);
// the highlighted time says it can be pressed, only if you hesitate (option C, Àlex 12-10): #hero carries its look.
// A new sweep or beat restarts its animation; each class leaves when its animation ends, or the board's redraw every
// minute (a new #dep) would play it again
const hero = byId('hero');
let hinted: Look = { raised: false, shine: 0, beat: 0 };
const hint = createHint(l => {
  const again = (c: string) => { hero.classList.remove(c); void hero.offsetWidth; hero.classList.add(c); };
  hero.classList.toggle('duda', l.raised);
  if(!l.raised) hero.classList.remove('brilla', 'batec');
  else { if(l.shine > hinted.shine) again('brilla'); if(l.beat > hinted.beat) again('batec'); }
  hinted = l;
}, { still: reduce });
hero.classList.toggle('duda', hint.look().raised);
hero.addEventListener('animationend', e => { if(e.animationName === 'brilla' || e.animationName === 'batec') hero.classList.remove(e.animationName); });
// pressing the time, «compra’l» or the big row is understanding it; a click on the hero where nothing answers (the
// window, the wall) is a doubt. A click, not a pointerdown: a finger that scrolls the page clicks nothing
document.addEventListener('click', e => {
  const t = e.target as Element;
  if(t.closest('#dep, #board .buy, #board button.big')) hint.press();
  else if(t.closest('#hero') && !t.closest('a, button, input, label, select, dialog, .tk, .ruler')) hint.miss();
});
const scenery = createScenery(world, () => { flaps.play(); hint.enter(); });
// the weather at home: the window repaints when it changes (also the still frame of reduced motion, or paused)
const weather = createWeather(w => { if(!world) return; world.setWeather(w); if(!scenery.isPlaying()) world.frame(0, 0, 1); });
// the lines' notices: the board redraws its stamp when what is known changes
const avisos = createAvisos(() => render());
// the live delay of the train shown (Renfe's real-time feed): the board redraws when what is known changes
const retards = createRetards(() => render());
const { render } = setupTimetable({ world, table, scenery, weather, avisos, retards });
render();
// the window's size depends on the tickets and the fonts: measure it again once they are in, and repaint the still
// frame too (reduced motion, or paused), which otherwise keeps the window where it was first painted
document.fonts && document.fonts.ready.then(()=> { if(!world) return; world.resize(); if(!scenery.isPlaying()) world.frame(0, 0, 1); });
scenery.repaint();
setupShelf(world);
setupPrivacy();

// what check.py reads from the page (modules keep everything else private)
declare global { interface Window { reus: { hingeAt: typeof hingeAt, dropped: typeof dropped, ScrollTrigger: typeof ScrollTrigger, paisaje: () => number | null, playing: () => boolean, letras: { pair: typeof pair, state: typeof state }, daylight: typeof daylight, tiempo: () => string, avisos: () => unknown, acuarela: () => number | null } } }
window.reus = { hingeAt, dropped, ScrollTrigger, paisaje: () => world ? world.grain() : null, playing: scenery.isPlaying, letras: { pair, state }, daylight, tiempo: weather.now, avisos: avisos.now, acuarela: () => world ? world.painted() : null };

// without a connection the site still opens, with the timetable it was built with (src/sw.js); only the built site
// has the worker, not `npm run dev`
if(import.meta.env.PROD && 'serviceWorker' in navigator)
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }, {once: true});

// visits (P1-4): Vercel Web Analytics, no cookies, page views only. Vercel serves the script once Analytics is
// enabled for the project; nowhere else is it there, so neither check.py nor `npm run dev` asks for it (src/visites.ts)
if(import.meta.env.PROD && counted(location.hostname))
  document.head.append(Object.assign(document.createElement('script'), {src: '/_vercel/insights/script.js'}));
