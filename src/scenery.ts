import { reduce, state } from './state';
import { byId } from './dom';
import type { World } from './world';

export interface Scenery { repaint(): void; kick(): void; isPlaying(): boolean }

// the landscape's loop: it paints itself in, then the train sets off; it rests when the hero is out of view
// or the tab is hidden. R repaints and P pauses, for recording only: with ?grabar in the URL (one-key shortcuts
// would fire by accident for the public, WCAG 2.1.4)
// onIn: the hero has come in (its texts appear); the name's board turns its flaps then (flaps.ts)
export function createScenery(world: World | null, onIn: () => void = () => {}): Scenery {
  const PAINT = 4.6, SPEED = 22;
  let t0 = performance.now(), lastT = t0, rafId = 0, acc = 0, v = 0, playing = !reduce;
  const stage = byId('stage');
  function show(){ if(stage.classList.contains('in')) return; stage.classList.add('in'); onIn(); }
  function repaint(){
    t0 = performance.now(); v = 0; stage.classList.remove('in');
    if(reduce || !world){ show(); if(world) world.frame(0,0,1); return; }
    playing = true; kick();
  }
  function loop(t: number){
    const dt = Math.min(.05, (t-lastT)/1000); lastT = t;
    const el = (t - t0)/1000, reveal = Math.min(1, el/PAINT);
    if(el > PAINT*.75) show();
    const target = el > PAINT ? SPEED * (state.dir==='bcn' ? -1 : 1) : 0;
    v += (target - v) * Math.min(1, dt*.45);
    acc += dt;
    if(acc >= 1/30){ world!.frame(v*acc, Math.floor(el*8)/8, reveal); acc = 0; }
    if(playing && !document.hidden && !offstage) rafId = requestAnimationFrame(loop); else rafId = 0;
  }
  let offstage = false;
  addEventListener('scroll', ()=>{ const off = scrollY >= innerHeight - 1; if(off !== offstage){ offstage = off; if(!off && playing) kick(); } }, {passive:true});
  function kick(){ if(!rafId && world){ lastT = performance.now(); rafId = requestAnimationFrame(loop); } }
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && playing) kick(); });
  addEventListener('resize', ()=>{ if(!playing && world) world.frame(0,0,1); });
  // the painted window follows #win, which also moves without a resize: the board grows a line at night
  // («Hoy ya no quedan regionales»), another town, a trip of tomorrow. Read only on resize, the painting would
  // keep the old window and paint it under the text. Its cell too: #win is centred in it, so it can move
  // without changing size
  if(world){ const ro = new ResizeObserver(()=>{ world.resize(); if(!playing) world.frame(0,0,1); });
    ro.observe(byId('win')); ro.observe(byId('win').parentElement!); }
  if(new URLSearchParams(location.search).has('grabar')) addEventListener('keydown', e=>{
    if((e.target as Element).closest?.('input,button')) return;
    if(e.key==='r' || e.key==='R') repaint();
    if(e.key==='p' || e.key==='P'){ playing=!playing; if(playing) kick(); }   // space is left to scroll the page
  });
  return { repaint, kick, isPlaying: () => playing };
}
