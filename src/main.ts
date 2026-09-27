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

const world = build3D();
const table = createTable();
const scenery = createScenery(world);
const { render } = setupTimetable({ world, table, scenery });
render();
document.fonts && document.fonts.ready.then(()=> world && world.resize());
scenery.repaint();
setupShelf(world);

// what check.py reads from the page (modules keep everything else private)
declare global { interface Window { reus: { hingeAt: typeof hingeAt, dropped: typeof dropped, ScrollTrigger: typeof ScrollTrigger, letras: { pair: typeof pair, state: typeof state } } } }
window.reus = { hingeAt, dropped, ScrollTrigger, letras: { pair, state } };
