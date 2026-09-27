import './styles/base.css';
import './styles/hero.css';
import './styles/table.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { build3D } from './world.js';
import { createTable } from './table.js';
import { createScenery } from './scenery.js';
import { setupTimetable } from './timetable.js';
import { setupShelf, dropped, hingeAt } from './shelf.js';

const world = build3D();
const table = createTable();
const scenery = createScenery(world);
const { render } = setupTimetable({ world, table, scenery });
render();
document.fonts && document.fonts.ready.then(()=> world && world.resize());
scenery.repaint();
setupShelf(world);

// what check.py reads from the page (modules keep everything else private)
window.reus = { hingeAt, dropped, ScrollTrigger };
