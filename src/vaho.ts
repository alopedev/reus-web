// The mist on the inside of the window, every day (Àlex 08-11, idea 4 B): a fingertip or the cursor wipes thin lines
// in it, the water they push runs down in drops, and the mist comes back in about 40 s; with rain or fog at home it is
// thicker (watercolor.frag, tWipe and aliento). On a desk the cursor passing over the glass draws. On a phone a finger
// on the window scrolls the page like anywhere else until a tap breathes on the glass («Toca y empaña», gesture b):
// from then on one finger draws there, until 4 s without touching it or a touch outside. The first visit finds a few
// words wiped in the mist, as if someone had written them (hint A, once per browser: vidre.ts). Not built with
// reduced motion (world.ts)
import { CanvasTexture, LinearFilter } from 'three';
import { byId } from './dom';
import { browserStore } from './remember';
import { hintDue, hintWords, isTap, type Touch } from './vidre';

const N = 512;            // the canvas: white where the glass is wiped
const R = 5*N/256;        // a fingertip's radius
const BACK = 40;          // seconds for the mist to come back
const IDLE = 4000;        // ms without a finger before the glass is left and a finger scrolls again

export interface Vaho { tex: CanvasTexture; breath: {v: number}; wiped(): number }

export function createVaho(): Vaho {
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d', {willReadFrequently: false})!;
  g.fillStyle = '#000'; g.fillRect(0, 0, N, N);
  const tex = new CanvasTexture(cv); tex.minFilter = tex.magFilter = LinearFilter;
  const breath = {v: 0};    // a breath on the glass: the mist thickens while the finger may draw (lerped in world.ts)
  const glass = byId('win');
  let last: [number, number] | null = null, drips: {x: number, y: number, len: number, v: number}[] = [];
  let lastStroke = -1e9;
  function at(x: number, y: number): [number, number] | null {
    const r = glass.getBoundingClientRect(), u = (x - r.left)/r.width, v = (y - r.top)/r.height;
    return u < 0 || u > 1 || v < 0 || v > 1 ? null : [u*N, v*N];
  }
  function dab(x: number, y: number){
    const gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
  }
  function stroke(a: [number, number], b: [number, number]){
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])/(R*.6)));
    for(let i = 0; i <= n; i++){
      const x = a[0] + (b[0] - a[0])*i/n, y = a[1] + (b[1] - a[1])*i/n;
      dab(x, y);
      if(Math.random() < .025) drips.push({x, y, len: 0, v: (6 + Math.random()*12)});   // water gathers and runs down
    }
    lastStroke = performance.now(); tex.needsUpdate = true;
  }
  function move(x: number, y: number){
    const p = at(x, y);
    if(p) stroke(last && Math.hypot(p[0] - last[0], p[1] - last[1]) < N*.06 ? last : p, p);   // a jump starts a new stroke
    last = p;
  }
  // the mouse: drawing as the cursor passes over the glass
  addEventListener('pointermove', e => { if(e.pointerType === 'mouse') move(e.clientX, e.clientY); }, {passive: true});
  // a finger: a tap breathes on the glass, and then it draws
  glass.style.setProperty('-webkit-user-select', 'none'); glass.style.setProperty('-webkit-touch-callout', 'none');
  const say = sayer(glass);
  let on = false, off = 0, t0: Touch | null = null;
  const stop = () => { on = false; glass.style.touchAction = ''; breath.v = 0; say('', 1); };
  const later = () => { clearTimeout(off); off = window.setTimeout(stop, IDLE); };
  glass.addEventListener('touchstart', e => {
    const t = e.touches[0]; t0 = {x: t.clientX, y: t.clientY, t: e.timeStamp}; last = null;   // when it happened, not when a busy page got to it
    if(on){ clearTimeout(off); move(t.clientX, t.clientY); }
  }, {passive: true});
  // not passive: while drawing, the finger is the glass's, not the page's (touch-action is read when a touch starts,
  // so it is set on the tap, for the next one; this covers a browser that read it before)
  glass.addEventListener('touchmove', e => { if(on){ e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); } }, {passive: false});
  glass.addEventListener('touchend', e => {
    last = null;
    const t = e.changedTouches[0];
    if(!on && t0 && isTap(t0, {x: t.clientX, y: t.clientY, t: e.timeStamp})){
      on = true; glass.style.touchAction = 'none'; breath.v = 1; say('Dibuixa al vidre', 1800);
    }
    if(on) later();
  });
  addEventListener('touchstart', e => { if(on && !glass.contains(e.target as Node)) stop(); }, {passive: true});
  // the first visit: a few words wiped in the mist, written left to right once the hero has come in
  const stage = byId('stage');
  const go = () => setTimeout(() => { if(hintDue(browserStore())) void write(hintWords(matchMedia('(hover: none)').matches)); }, 900);
  if(stage.classList.contains('in')) go();
  else new MutationObserver((_, o) => { if(stage.classList.contains('in')){ o.disconnect(); go(); } }).observe(stage, {attributes: true, attributeFilter: ['class']});
  async function write(lines: string[]){
    const font = `700 ${Math.round(N*.095)}px Literata`;
    await document.fonts.load(font).catch(() => null);
    const r = glass.getBoundingClientRect(), k = r.height/Math.max(1, r.width);   // the canvas is stretched to the glass: write squeezed
    const t = performance.now(), dur = 1600;
    breath.v = 1; setTimeout(() => { if(!on) breath.v = 0; }, 7000);   // breathed on, so the words read
    const step = () => {
      const f = Math.min(1, (performance.now() - t)/dur), W = N/k;
      g.save(); g.setTransform(k, 0, 0, 1, 0, 0);
      g.beginPath(); g.rect(0, 0, W*(.12 + .8*f), N); g.clip();
      g.font = `${font}, Georgia, serif`; g.textAlign = 'center'; g.lineJoin = g.lineCap = 'round';
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = N*.013;
      lines.forEach((l, i) => g.strokeText(l, W/2, N*(.3 + .16*i)));
      g.restore(); lastStroke = performance.now(); tex.needsUpdate = true;
      if(f < 1) requestAnimationFrame(step);
    };
    step();
  }
  // the mist coming back, and the runs. A canvas rounds a slow fade to nothing at low values, so it fades in steps of
  // 400 ms and, once nothing has been drawn for a while, is cleared outright; a clean glass costs nothing
  let fade = 0, prev = performance.now(), clean = true;
  setInterval(() => {
    const now = performance.now(), dt = Math.min(.5, (now - prev)/1000); prev = now;
    if(now - lastStroke < 1000*BACK*2.5 || drips.length) clean = false;
    if(clean) return;
    fade += 3*dt/BACK;
    if(fade >= .03){ g.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; g.fillRect(0, 0, N, N); fade = 0; }
    for(const d of drips){
      const l0 = d.len; d.len = Math.min(68, d.len + d.v*dt);
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(d.x, d.y + l0); g.lineTo(d.x + Math.sin((d.y + d.len)*.2)*1.6, d.y + d.len); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(d.x, d.y + d.len, 2.2, 0, 7); g.fill();
    }
    drips = drips.filter(d => d.len < 68);
    if(now - lastStroke > 1000*BACK*2.5 && !drips.length){ g.fillStyle = '#000'; g.fillRect(0, 0, N, N); clean = true; }
    tex.needsUpdate = true;
  }, 120);
  // for check.py: how much of the glass is wiped (in canvas pixels)
  const wiped = () => { const d = g.getImageData(0, 0, N, N).data; let s = 0; for(let i = 0; i < d.length; i += 4) s += d[i]; return s/255; };
  return { tex, breath, wiped };
}

// a word on the glass, in the window's own ink, that goes after a while
function sayer(glass: HTMLElement){
  const p = document.createElement('p'); p.className = 'diu'; p.setAttribute('aria-hidden', 'true');
  glass.appendChild(p);
  let t = 0;
  return (words: string, ms = 2200) => { p.textContent = words; p.classList.toggle('on', !!words); clearTimeout(t); t = window.setTimeout(() => p.classList.remove('on'), ms); };
}
