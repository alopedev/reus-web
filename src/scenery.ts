import { reduce, state } from './state';
import { byId } from './dom';
import type { World } from './world';

export interface Scenery { repaint(): void; kick(): void; isPlaying(): boolean }

// the landscape's loop: it paints itself in, then the train sets off; it rests when the hero is out of view
// or the tab is hidden. R repaints and P pauses, for recording only
export function createScenery(world: World | null): Scenery {
  const PAINT = 4.6, SPEED = 22;
  let t0 = performance.now(), lastT = t0, rafId = 0, acc = 0, v = 0, playing = !reduce;
  const stage = byId('stage');
  function repaint(){
    t0 = performance.now(); v = 0; stage.classList.remove('in');
    if(reduce || !world){ stage.classList.add('in'); if(world) world.frame(0,0,1); return; }
    playing = true; kick();
  }
  function loop(t: number){
    const dt = Math.min(.05, (t-lastT)/1000); lastT = t;
    const el = (t - t0)/1000, reveal = Math.min(1, el/PAINT);
    if(el > PAINT*.75) stage.classList.add('in');
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
  addEventListener('keydown', e=>{
    if((e.target as Element).closest?.('input,button')) return;
    if(e.key==='r' || e.key==='R') repaint();
    if(e.key==='p' || e.key==='P'){ playing=!playing; if(playing) kick(); }   // space is left to scroll the page
  });
  return { repaint, kick, isPlaying: () => playing };
}
