// The mist on the inside of the window, every day (Àlex 08-11, idea 4 B): a fingertip or the cursor wipes thin lines
// in it, the water they push runs down in drops, and the mist comes back in about 40 s; with rain or fog at home it is
// thicker (watercolor.frag, tWipe and aliento). On a desk the cursor passing over the glass draws. On a phone the glass
// and the rest of the page work apart (Àlex 08-11): a finger on the glass draws in any direction and never moves the
// page (touch-action none, there only); anywhere else it scrolls as always. The first visit finds one word wiped in the
// mist, «Bon viatge», written by a finger (once per browser: vidre.ts); it goes as soon as someone draws. Not
// built with reduced motion (world.ts)
import { CanvasTexture, LinearFilter } from 'three';
import { byId } from './dom';
import { browserStore } from './remember';
import { handwriting, hintDue, written } from './vidre';

const N = 512;            // the canvas: white where the glass is wiped
const R = 5*N/256;        // a fingertip's radius
const BACK = 40;          // seconds for the mist to come back

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
    lastStroke = performance.now(); drew(); compose(); tex.needsUpdate = true;
  }
  function move(x: number, y: number){
    const p = at(x, y);
    if(p) stroke(last && Math.hypot(p[0] - last[0], p[1] - last[1]) < N*.06 ? last : p, p);   // a jump starts a new stroke
    last = p;
  }
  // the mouse: drawing as the cursor passes over the glass
  addEventListener('pointermove', e => { if(e.pointerType === 'mouse') move(e.clientX, e.clientY); }, {passive: true});
  // a finger on the glass is the glass's: it draws, up, down or sideways, and the page stays. touch-action is read when
  // a touch starts, so it is set here, before any; the touchmove is not passive as well, for a browser that ignores it
  glass.style.touchAction = 'none';
  glass.style.setProperty('-webkit-user-select', 'none'); glass.style.setProperty('-webkit-touch-callout', 'none');
  let touched = -1e9, down = false;   // a breath on the glass while a finger draws and a little after, so the line reads
  glass.addEventListener('touchstart', e => {
    down = true; breath.v = 1; last = null;
    move(e.touches[0].clientX, e.touches[0].clientY);
  }, {passive: true});
  glass.addEventListener('touchmove', e => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
  glass.addEventListener('touchend', () => { last = null; down = false; touched = performance.now(); });
  // the first visit: «Bon viatge» wiped in the mist, written left to right once the hero has come in, on a layer of its
  // own (hint), so that it can go as soon as someone draws without taking their lines with it
  const hc = document.createElement('canvas'); hc.width = hc.height = N;
  const h = hc.getContext('2d')!;
  const out = document.createElement('canvas'); out.width = out.height = N;
  const o = out.getContext('2d')!;
  let hintA = 0, hintDone = false, hintGoing = false;
  function compose(){
    if(hintA <= 0){ if(tex.image !== cv){ tex.image = cv; } return; }
    o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.drawImage(cv, 0, 0);
    o.globalCompositeOperation = 'lighten'; o.globalAlpha = hintA; o.drawImage(hc, 0, 0);
    if(tex.image !== out) tex.image = out;
  }
  const stage = byId('stage');
  const go = () => setTimeout(() => { if(hintDue(browserStore())) write(); }, 900);
  if(stage.classList.contains('in')) go();
  else new MutationObserver((_, ob) => { if(stage.classList.contains('in')){ ob.disconnect(); go(); } }).observe(stage, {attributes: true, attributeFilter: ['class']});
  // the words written as a finger writes them, joined up, stroke after stroke at a hand's pace (Àlex 08-11: «escrit a
  // mà amb el dit»), with a fingertip's soft edge. The canvas is stretched to the glass, so they are fitted in screen units
  function write(){
    const r = glass.getBoundingClientRect(), k = .74*r.width/Math.max(1, r.height);
    const word = handwriting(), ys = word.flatMap(s => s.map(p => p[1]));
    const top = Math.min(...ys), base = N*(.36 - (top + Math.max(...ys))*k/2);
    const tip = Math.min(R, Math.max(4, -top*k*N*.055));
    const to = (p: [number, number]) => [N*(.13 + .74*p[0]), base + p[1]*k*N] as const;
    const t = performance.now(), dur = 2600;
    hintA = 1; breath.v = 1;   // breathed on, so the word reads
    const step = () => {
      const f = Math.min(1, (performance.now() - t)/dur);
      h.clearRect(0, 0, N, N); h.lineCap = h.lineJoin = 'round';
      for(const [w, a] of [[2*tip, .45], [1.1*tip, 1]] as const){
        h.lineWidth = w; h.strokeStyle = `rgba(255,255,255,${a})`;
        for(const s of written(word, f)){
          h.beginPath(); const [x0, y0] = to(s[0]); h.moveTo(x0, y0 - .01);   // a dot is a stroke too
          for(const p of s){ const [x, y] = to(p); h.lineTo(x, y); }
          h.stroke();
        }
      }
      compose(); tex.needsUpdate = true;
      if(f < 1) requestAnimationFrame(step); else hintDone = true;
    };
    step();
  }
  // someone draws: the word goes, in a moment (a stroke while it is still being written does not count: a cursor
  // resting on the glass would wipe it before it could be read)
  const drew = () => { if(hintA > 0 && hintDone && !hintGoing){ hintGoing = true; } };
  // the mist coming back, and the runs. A canvas rounds a slow fade to nothing at low values, so it fades in steps of
  // 400 ms and, once nothing has been drawn for a while, is cleared outright; a clean glass costs nothing
  let fade = 0, prev = performance.now(), clean = true;
  setInterval(() => {
    const now = performance.now(), dt = Math.min(.5, (now - prev)/1000); prev = now;
    if(hintA > 0){
      hintA = Math.max(0, hintA - dt/(hintGoing ? .6 : 30));   // as someone draws, at once; untouched, with the mist
      if(hintA <= .02) hintA = 0;
      compose(); tex.needsUpdate = true;
    }
    breath.v = hintA > 0 || down || now - touched < 3000 ? 1 : 0;
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
    compose(); tex.needsUpdate = true;
  }, 120);
  // for check.py: how much of the glass is wiped (in canvas pixels)
  const wiped = () => { compose(); const d = (tex.image === out ? o : g).getImageData(0, 0, N, N).data; let s = 0; for(let i = 0; i < d.length; i += 4) s += d[i]; return s/255; };
  return { tex, breath, wiped };
}
