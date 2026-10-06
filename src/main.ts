import './styles/base.css';
import './styles/hero.css';
import './styles/table.css';
import './styles/letters.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { build3D } from './world';
import { createTable } from './table';
import { createScenery } from './scenery';
import { setupTimetable } from './timetable';
import { setupShelf, dropped, hingeAt } from './shelf';
import { pair, state } from './letters';
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
// the link still goes down to the table, without writing #repisa into the address (its href stays for no script)
byId('more').addEventListener('click', e => { e.preventDefault(); byId('repisa').scrollIntoView({behavior: 'smooth'}); });

const world = build3D();
const table = createTable();
const scenery = createScenery(world);
const { render } = setupTimetable({ world, table, scenery });
render();
// the window's size depends on the tickets and the fonts: measure it again once they are in, and repaint the still
// frame too (reduced motion, or paused), which otherwise keeps the window where it was first painted
document.fonts && document.fonts.ready.then(()=> { if(!world) return; world.resize(); if(!scenery.isPlaying()) world.frame(0, 0, 1); });
scenery.repaint();
setupShelf(world);

// what check.py reads from the page (modules keep everything else private)
declare global { interface Window { reus: { hingeAt: typeof hingeAt, dropped: typeof dropped, ScrollTrigger: typeof ScrollTrigger, paisaje: () => number | null, playing: () => boolean, letras: { pair: typeof pair, state: typeof state } } } }
window.reus = { hingeAt, dropped, ScrollTrigger, paisaje: () => world ? world.grain() : null, playing: scenery.isPlaying, letras: { pair, state } };

// without a connection the site still opens, with the timetable it was built with (src/sw.js); only the built site
// has the worker, not `npm run dev`
if(import.meta.env.PROD && 'serviceWorker' in navigator)
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }, {once: true});
