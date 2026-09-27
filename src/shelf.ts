import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { byId, find } from './dom';
import type { World } from './world';
import * as letters from './letters';

let world: World | null = null;   // the landscape, for the wash on the wall; null without WebGL

// scrolling down, the gaze drops from the window to the table: the wall tilts away, the table rises and lands,
// the papers fall onto it and the notebook opens. Follows the finger both ways.
export function setupShelf(w: World | null): void {
  world = w;
  gsap.registerPlugin(ScrollTrigger);
  const PINNED = '(min-width:1000px) and (min-height:780px) and (min-aspect-ratio:1/1)';
  gsap.matchMedia().add({motion:'(prefers-reduced-motion: no-preference)', wide:'(min-width:701px)', pinned:PINNED}, ctx => {
    if(!ctx.conditions?.motion) return;
    const {pinned} = ctx.conditions, shelf = byId('repisa');
    // the hinge reads the scroll directly: it must match the table's real position on every frame
    const onScroll = () => pitch();
    // the letters' rest positions scale with the root: re-measure on resize, from the same listener as pitch()
    const onResize = () => { letters.measure(); pitch(); };
    addEventListener('scroll', onScroll, {passive:true}); addEventListener('resize', onResize);
    document.fonts ? document.fonts.ready.then(() => { letters.measure(); pitch(); }) : letters.measure();
    pitch();
    // each paper with the tilt it rests at (the same as in the stylesheet)
    const papers = ([['#folleto', -2.5], ['#cuaderno', 1], ['#reverso', -1.2]] as const).map(([s, r]): [HTMLElement, number] => [find(s), r]);
    const leaf = find('.cuaderno .izq');
    if(pinned){
      // layout offsets, not the trigger's box: the shelf is tilted by pitch() while it is measured
      const tl = gsap.timeline({scrollTrigger:{start:() => shelf.offsetTop, end:() => shelf.offsetTop + shelf.offsetHeight - innerHeight, scrub:.6, invalidateOnRefresh:true}});
      // each paper starts falling before the previous one lands; the cover opens as the last one settles
      papers.forEach(([el, rot], i) => tl.add(land(el, rot, 35), i * .35));
      tl.add(openLeaf(leaf, 'Y', 1), 1.55);
    } else {
      // stacked papers: each one lands as it scrolls in (layout offsets again: the table may still be tilted)
      const between = (el: HTMLElement, a: number, b: number) => ({start:() => pageTop(el) - innerHeight * a, end:() => pageTop(el) - innerHeight * b, scrub:.6, invalidateOnRefresh:true});
      papers.forEach(([el, rot]) => gsap.timeline({scrollTrigger:between(el, 1, .65)}).add(land(el, rot, 10)));
      // the leaf turns sideways when the pages sit side by side, and folds down when they are stacked
      const side = getComputedStyle(find('.cuaderno')).gridTemplateColumns.trim().split(/\s+/).length > 1;
      gsap.timeline({scrollTrigger:between(papers[1][0], .55, .2)}).add(side ? openLeaf(leaf, 'Y', 1) : openLeaf(leaf, 'X', -1));
    }
    return () => {
      removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); pitch(true);
      letters.reset();
      [...papers.map(([el]) => el), leaf].forEach(rest);
    };
  });
}

const inOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
// where an element sits on the page, ignoring any transform on the way
const pageTop = (el: HTMLElement) => { let y = 0; for(let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop; return y; };
const rest = (el: HTMLElement) => ['transform', 'opacity', 'visibility', '--alto'].forEach(p => el.style.removeProperty(p));

// a paper falls with weight: it speeds up and flutters on the way down, its shadow says how high it still is (--alto),
// then it settles with a small overshoot. Drawn straight onto the element so the scrub can run it both ways.
function land(el: HTMLElement, rot: number, drop: number){
  const k = {u:0, s:0};
  const draw = () => {
    if(k.s >= 1){ rest(el); return; }
    const h = 1 - Math.pow(k.u, 1.4), settle = Math.sin(Math.PI * k.s);
    const r = rot + 9 * h + 3 * Math.sin(k.u * Math.PI * 2) * h - 1.4 * settle;
    el.style.transform = `translateY(${(-drop * h).toFixed(3)}rem) rotate(${r.toFixed(2)}deg) scale(${(1 + .1 * h - .012 * settle).toFixed(4)})`;
    el.style.opacity = Math.min(1, k.u * 5).toFixed(3);
    el.style.visibility = k.u > 0 ? '' : 'hidden';
    el.style.setProperty('--alto', h.toFixed(3));
  };
  draw();
  return gsap.timeline().to(k, {u:1, duration:.82, ease:'none', onUpdate:draw}).to(k, {s:1, duration:.18, ease:'none', onUpdate:draw});
}

// the cover opens, lifts a little past flat and settles
function openLeaf(leaf: HTMLElement, axis: 'X' | 'Y', sign: 1 | -1){
  const k = {t:0};
  const draw = () => {
    if(k.t >= 1){ leaf.style.removeProperty('transform'); return; }
    const deg = 180 * (1 - inOut(clamp01(k.t / .85))) - 4 * Math.sin(Math.PI * clamp01((k.t - .85) / .15));
    leaf.style.transform = `perspective(1800px) rotate${axis}(${(sign * deg).toFixed(2)}deg)`;
  };
  draw();
  return gsap.to(k, {t:1, duration:1.1, ease:'none', onUpdate:draw});
}

// the camera pitches down. Wall and table share one hinge that follows the scroll exactly, so they never part.
// The wall leads and the table follows, touching down just before the end of the first screen with a small bump
// that only ever tilts it up (flatter than flat would open a gap at its edge). The table's near edge comes towards
// you, so it only ever widens; the wall leans back and is overscanned so its top edge never enters the frame.
// Nothing behind them ever shows (checked by check.py). The angles follow the scroll 1:1: smoothing them let
// slow frames open a gap, so the softness lives in the curves instead.
const PITCH_WALL = 34, PITCH_TABLE = 24;
// how far the gaze has dropped (0 at the hero, 1 once the table fills the screen), and where the wall meets the
// table on screen for it. check.py reads both to know when the page has caught up with the scroll
export const dropped = (): number => clamp01(scrollY / innerHeight);
export const hingeAt = (p: number): number => innerHeight * (1 - p);

export interface Pose { p: number; vh: number; P: number; fold: number; wall: number; table: number; s: number; shade: number; }
// the wall and table's angles, hinge and scale for a given progress: the one place this geometry is computed,
// shared by pitch() (which paints it) and letters.ts (which projects the flying letters through the same math)
export function pose(p: number): Pose {
  const vh = innerHeight, P = 2 * vh;
  const fold = hingeAt(p);
  const wall = PITCH_WALL * inOut(clamp01(p / .85));
  const bump = p > .9 ? 1.4 * Math.sin(Math.PI * (p - .9) / .1) : 0;
  const table = PITCH_TABLE * Math.pow(1 - inOut(clamp01((p - .1) / .8)), 1.2) + bump;
  // scale so the wall's top edge, projected from the hinge, stays outside the frame; sized as if the hinge sat
  // 15% of a screen lower, a spare margin for a frame where the scroll and the fixed wall do not quite agree
  const tw = wall * Math.PI / 180, reach = fold + .15 * vh;
  const s = Math.max(1, P / (P * Math.cos(tw) - reach * Math.sin(tw)));
  const shade = Math.pow(wall / PITCH_WALL, 1.3);
  return {p, vh, P, fold, wall, table, s, shade};
}
function pitch(reset = false){
  const hero = byId('hero'), shelf = byId('repisa');
  const p = reset ? 0 : dropped();
  const {P, fold, wall, table, s, shade} = pose(p);
  hero.style.transformOrigin = `50% ${fold.toFixed(1)}px`;
  hero.style.transform = p > 0 && p < 1 ? `perspective(${P}px) rotateX(${wall.toFixed(3)}deg) scale(${s.toFixed(4)})` : '';
  hero.style.visibility = p >= 1 ? 'hidden' : '';
  shelf.style.transformOrigin = '50% 0';
  shelf.style.transform = p > 0 && table > .001 ? `perspective(${P}px) rotateX(${table.toFixed(3)}deg)` : '';
  // the wall darkens as it turns away from the window's light: a pigment wash painted in the wall's own
  // shader, climbing from the hinge (in the wall's own coordinates the hinge sits at uv.y = p), and the
  // texts on it dim with it (--lavado). With no WebGL, `world` is null and the flat #sombra veil is the fallback
  if(shade > 0) hero.style.setProperty('--lavado', shade.toFixed(3)); else hero.style.removeProperty('--lavado');
  if(world) world.setWash(p, shade);
  else byId('sombra').style.opacity = (.6 * shade).toFixed(3);
  byId('more').style.opacity = Math.max(0, 1 - p * 8).toFixed(3);
  letters.render(p);
}
