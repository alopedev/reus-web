// PROTOTYPE idea 4: mist on the inside of the glass when it rains or there is fog at home, wiped by a finger or the
// cursor over the window, and coming back slowly. ?vaho=a (a hand: a wide band, back in ~15 s), b (a fingertip: thin
// lines that run, back in ~40 s), c (the mist only round the edges and along the bottom, as it condenses; back in ~20 s)
import { CanvasTexture, LinearFilter } from 'three';

export const VAHO = typeof location === 'undefined' ? 0 : ' abc'.indexOf(new URLSearchParams(location.search).get('vaho') || ' ');

export function createVaho(){
  const N = 256;
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, N, N);
  const tex = new CanvasTexture(cv); tex.minFilter = tex.magFilter = LinearFilter;
  const R = [0, 18, 5, 14][VAHO], back = [1, 15, 40, 20][VAHO];
  const breath = {v: 0};
  let last: [number, number] | null = null, lastT = performance.now(), drips: {x: number, y: number, len: number, v: number}[] = [];
  function at(e: PointerEvent): [number, number] | null {
    const r = document.getElementById('win')!.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width, y = (e.clientY - r.top)/r.height;
    return x < 0 || x > 1 || y < 0 || y > 1 ? null : [x*N, y*N];
  }
  function stroke(a: [number, number], b: [number, number]){
    const ax = (r: number) => r*N/256;
    const d = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.ceil(d/(R*.3)));
    for(let i = 0; i <= n; i++){
      const x = a[0] + (b[0]-a[0])*i/n, y = a[1] + (b[1]-a[1])*i/n, r = ax(R);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(VAHO === 2 ? .55 : .35, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      if(VAHO === 2 && Math.random() < .025) drips.push({x, y, len: 0, v: 3 + Math.random()*6});   // water gathers and runs down
    }
    tex.needsUpdate = true;
  }
  function move(e: PointerEvent){
    const p = at(e);
    if(p && last && Math.hypot(p[0]-last[0], p[1]-last[1]) < N*.06) stroke(last, p); else if(p) stroke(p, p);   // a jump starts a new stroke
    last = p;
  }
  // the mouse: drawing as the cursor passes over the glass (?raton=press: only with the button down)
  const press = new URLSearchParams(location.search).get('raton') === 'press';
  addEventListener('pointermove', e => { if(e.pointerType === 'mouse' && (!press || e.buttons)) move(e); else if(e.pointerType === 'mouse') last = null; }, {passive: true});
  addEventListener('pointerup', e => { if(e.pointerType === 'mouse') last = null; });
  // a finger on the glass (?gesto=): ahora (sideways draws, up/down scrolls, held still draws), a (one finger draws, two
  // fingers move the page, as the maps do), b (a tap breathes on the glass: from then on one finger draws, until 4 s
  // without touching it or a touch outside), c (the glass takes the finger: the page moves from the wall)
  const GESTO = new URLSearchParams(location.search).get('gesto') || 'ahora';
  const glass = document.getElementById('win')!;
  glass.style.setProperty('-webkit-user-select', 'none'); glass.style.setProperty('-webkit-touch-callout', 'none'); glass.style.userSelect = 'none';
  const pt = (t: {clientX: number, clientY: number}) => ({clientX: t.clientX, clientY: t.clientY} as PointerEvent);
  const hint = document.createElement('p');   // a word on the glass, in the window's own ink
  hint.style.cssText = 'position:absolute;left:0;right:0;bottom:12%;margin:0;text-align:center;font:700 .95rem/1.2 var(--texto);color:#F1EADC;text-shadow:0 1px 3px rgba(45,36,28,.8);pointer-events:none;opacity:0;transition:opacity .4s';
  if(getComputedStyle(glass).position === 'static') glass.style.position = 'relative';
  glass.appendChild(hint);
  let hintT = 0;
  const say = (words: string, ms = 2200) => { hint.textContent = words; hint.style.opacity = '1'; clearTimeout(hintT); hintT = window.setTimeout(() => hint.style.opacity = '0', ms); };
  if(GESTO === 'a' || GESTO === 'c'){
    glass.style.touchAction = 'none';
    let two: number | null = null, v = 0, lastT2 = 0, travel = 0, vert = 0, told = false;
    glass.addEventListener('touchstart', e => {
      if(e.touches.length > 1 && GESTO === 'a'){ two = (e.touches[0].clientY + e.touches[1].clientY)/2; last = null; v = 0; lastT2 = performance.now(); return; }
      two = null; last = null; travel = 0; vert = 0; move(pt(e.touches[0]));
    }, {passive: false});
    glass.addEventListener('touchmove', e => {
      e.preventDefault();
      if(two !== null && e.touches.length > 1){   // two fingers: the page follows them, with a little momentum after
        const y = (e.touches[0].clientY + e.touches[1].clientY)/2, now = performance.now();
        scrollBy({top: two - y, behavior: 'instant'}); v = (two - y)/Math.max(8, now - lastT2); two = y; lastT2 = now; return;
      }
      if(two !== null) return;
      const t = e.touches[0];
      if(last){ const r = glass.getBoundingClientRect(); travel += Math.abs(t.clientX - (last[0]/N*r.width + r.left)); vert += Math.abs(t.clientY - (last[1]/N*r.height + r.top)); }
      move(pt(t));
      if(GESTO === 'a' && !told && vert > 90 && vert > 2*travel){ told = true; say('Amb dos dits, la pàgina es mou'); }
    }, {passive: false});
    glass.addEventListener('touchend', e => {
      if(two !== null && e.touches.length === 0){
        let s = v*16; const glide = () => { if(Math.abs(s) < .5) return; scrollBy({top: s, behavior: 'instant'}); s *= .94; requestAnimationFrame(glide); };
        requestAnimationFrame(glide); two = null;
      }
      if(e.touches.length === 0) last = null;
    });
    glass.addEventListener('touchcancel', () => { two = null; last = null; });
  } else if(GESTO === 'b'){
    let on = false, off = 0, t0: {x: number, y: number, t: number} | null = null;
    const stop = () => { on = false; glass.style.touchAction = ''; breath.v = 0; say('', 1); };
    const later = () => { clearTimeout(off); off = window.setTimeout(stop, 4000); };
    glass.addEventListener('touchstart', e => {
      const t = e.touches[0]; t0 = {x: t.clientX, y: t.clientY, t: performance.now()}; last = null;
      if(on){ clearTimeout(off); move(pt(t)); }
    }, {passive: false});
    glass.addEventListener('touchmove', e => { if(on){ e.preventDefault(); move(pt(e.touches[0])); } }, {passive: false});
    glass.addEventListener('touchend', e => {
      last = null;
      const t = e.changedTouches[0];
      if(!on && t0 && performance.now() - t0.t < 350 && Math.hypot(t.clientX - t0.x, t.clientY - t0.y) < 10){
        on = true; glass.style.touchAction = 'none'; breath.v = 1; say('Dibuixa al vidre', 1800);   // a breath on the glass
      }
      if(on) later();
    });
    addEventListener('touchstart', e => { if(on && !glass.contains(e.target as Node)) stop(); }, {passive: true});
  } else {
    glass.style.touchAction = 'pan-y';
    let t0: {x: number, y: number} | null = null, mode: 'wait' | 'draw' | 'scroll' = 'wait', hold = 0;
    glass.addEventListener('touchstart', e => {
      if(e.touches.length > 1){ mode = 'scroll'; return; }
      const t = e.touches[0]; t0 = {x: t.clientX, y: t.clientY}; mode = 'wait'; last = null;
      clearTimeout(hold);
      hold = window.setTimeout(() => { if(mode === 'wait'){ mode = 'draw'; move(pt(t)); } }, 260);
    }, {passive: false});
    glass.addEventListener('touchmove', e => {
      const t = e.touches[0];
      if(mode === 'wait' && t0){
        const dx = t.clientX - t0.x, dy = t.clientY - t0.y;
        if(Math.hypot(dx, dy) < 8) return;
        clearTimeout(hold);
        mode = Math.abs(dx) > Math.abs(dy) ? 'draw' : 'scroll';
        if(mode === 'draw') move(pt({clientX: t0.x, clientY: t0.y}));
      }
      if(mode === 'draw'){ e.preventDefault(); move(pt(t)); }
    }, {passive: false});
    const end = () => { clearTimeout(hold); mode = 'wait'; t0 = null; last = null; };
    glass.addEventListener('touchend', end); glass.addEventListener('touchcancel', end);
  }
  (window as unknown as {__vaho: () => number}).__vaho = () => { const d = g.getImageData(0, 0, N, N).data; let s = 0; for(let i = 0; i < d.length; i += 4) s += d[i]; return s/255; };
  // the mist coming back, and the runs
  function tick(){
    const now = performance.now(), dt = Math.min(.5, (now - lastT)/1000); lastT = now;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(0,0,0,${Math.min(1, 3*dt/back)})`; g.fillRect(0, 0, N, N);
    for(const d of drips){
      const l0 = d.len; d.len = Math.min(34, d.len + d.v*dt);
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = .9; g.beginPath(); g.moveTo(d.x, d.y + l0); g.lineTo(d.x + Math.sin((d.y + d.len)*.4)*.8, d.y + d.len); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(d.x, d.y + d.len, 1.1, 0, 7); g.fill();
    }
    drips = drips.filter(d => d.len < 34);
    tex.needsUpdate = true;
  }
  setInterval(tick, 120);
  return { tex, breath };
}
