// PROTOTYPE idea 4: mist on the inside of the glass when it rains or there is fog at home, wiped by a finger or the
// cursor over the window, and coming back slowly. ?vaho=a (a hand: a wide band, back in ~15 s), b (a fingertip: thin
// lines that run, back in ~40 s), c (the mist only round the edges and along the bottom, as it condenses; back in ~20 s)
import { CanvasTexture, LinearFilter } from 'three';
import { tear } from './paper';

export const VAHO = typeof location === 'undefined' ? 0 : ' abc'.indexOf(new URLSearchParams(location.search).get('vaho') || ' ');

export function createVaho(){
  const N = 512, S = N/256;   // S: the sizes below were set on a 256 px canvas
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
    const d = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(1, Math.ceil(d/(R*S*.3)));
    for(let i = 0; i <= n; i++){
      const x = a[0] + (b[0]-a[0])*i/n, y = a[1] + (b[1]-a[1])*i/n, r = ax(R);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(VAHO === 2 ? .55 : .35, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      if(VAHO === 2 && Math.random() < .025) drips.push({x, y, len: 0, v: (3 + Math.random()*6)*S});   // water gathers and runs down
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
  // without touching it or a touch outside), c (a finger held still for half a second breathes on the glass and draws
  // in any direction until it lifts; one that moves sooner scrolls)
  const GESTO = new URLSearchParams(location.search).get('gesto') || 'ahora';
  const glass = document.getElementById('win')!;
  glass.style.setProperty('-webkit-user-select', 'none'); glass.style.setProperty('-webkit-touch-callout', 'none'); glass.style.userSelect = 'none';
  const pt = (t: {clientX: number, clientY: number}) => ({clientX: t.clientX, clientY: t.clientY} as PointerEvent);
  const hint = document.createElement('p');   // a word on the glass, in the window's own ink
  hint.style.cssText = 'position:absolute;left:0;right:0;bottom:12%;margin:0;text-align:center;font:700 .95rem/1.2 var(--texto);color:#F1EADC;text-shadow:0 1px 3px rgba(45,36,28,.8);pointer-events:none;opacity:0;transition:opacity .4s';
  if(getComputedStyle(glass).position === 'static') glass.style.position = 'relative';
  glass.appendChild(hint);
  let hintT = 0;
  let enter = () => {};   // ?gesto=b: what a tap on the glass does, also from the label (?pista=b)
  const say = (words: string, ms = 2200) => { hint.textContent = words; hint.style.opacity = '1'; clearTimeout(hintT); hintT = window.setTimeout(() => hint.style.opacity = '0', ms); };
  if(GESTO === 'a'){
    glass.style.touchAction = 'none';
    let two: number | null = null, v = 0, lastT2 = 0, travel = 0, vert = 0, told = false;
    glass.addEventListener('touchstart', e => {
      if(e.touches.length > 1){ two = (e.touches[0].clientY + e.touches[1].clientY)/2; last = null; v = 0; lastT2 = performance.now(); return; }
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
      if(!told && vert > 90 && vert > 2*travel){ told = true; say('Amb dos dits, la pàgina es mou'); }
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
        enter();
      }
      if(on) later();
    });
    enter = () => { on = true; glass.style.touchAction = 'none'; breath.v = 1; say('Dibuixa al vidre', 1800); later(); };   // a breath on the glass
    addEventListener('touchstart', e => { if(on && !glass.contains(e.target as Node)) stop(); }, {passive: true});
  } else if(GESTO === 'c'){
    glass.style.touchAction = 'pan-y';
    let t0: {x: number, y: number} | null = null, drawing = false, hold = 0, cur: PointerEvent | null = null;
    glass.addEventListener('touchstart', e => {
      clearTimeout(hold); drawing = false; last = null;
      if(e.touches.length > 1){ t0 = null; return; }
      const t = e.touches[0]; t0 = {x: t.clientX, y: t.clientY}; cur = pt(t);
      breath.v = .5;   // the breath gathers while the finger waits
      hold = window.setTimeout(() => { if(t0 && cur){ drawing = true; breath.v = 1; move(cur); } }, 500);
    }, {passive: false});
    glass.addEventListener('touchmove', e => {
      const t = e.touches[0]; cur = pt(t);
      if(drawing){ e.preventDefault(); move(cur); return; }
      if(t0 && Math.hypot(t.clientX - t0.x, t.clientY - t0.y) > 10){ clearTimeout(hold); t0 = null; breath.v = 0; }   // moved: the page scrolls
    }, {passive: false});
    const end = () => { clearTimeout(hold); drawing = false; t0 = null; last = null; breath.v = 0; };
    glass.addEventListener('touchend', end); glass.addEventListener('touchcancel', end);
    glass.addEventListener('contextmenu', e => e.preventDefault());
    const giveUp = () => { if(!drawing){ clearTimeout(hold); t0 = null; breath.v = 0; } };   // the browser took the finger to scroll
    glass.addEventListener('pointercancel', giveUp); addEventListener('scroll', giveUp, {passive: true});
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
  // PROTOTYPE (08-11): what tells a first visitor they can draw (?pista=): a (words wiped in the mist, as if someone
  // had written them), b (a paper stub stuck on the glass, like the others on the wall), c (a fingertip that wipes once)
  const PISTA = new URLSearchParams(location.search).get('pista');
  const touchy = matchMedia('(hover: none)').matches, slow = new URLSearchParams(location.search).has('lento') ? 6 : 1;   // ?lento: for the captures
  const fingerSvg = '<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M3 13c4-8 8 2 12-4s5-4 8-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="24" cy="4" r="2.4" fill="#E07A1F"/></svg>';
  function show(){
    const r = glass.getBoundingClientRect(), k = r.height/r.width;   // canvas pixels are stretched to the glass: draw squeezed
    if(PISTA === 'a'){
      const lines = touchy ? ['toca el vidre', 'i dibuixa'] : ['passa-hi', 'el ratolí'];
      const t0 = performance.now(), dur = 1600*slow; breath.v = 1; setTimeout(() => breath.v = 0, 7000*slow);   // the glass breathed on, so the words read
      const write = () => {
        const f = Math.min(1, (performance.now() - t0)/dur);
        g.save(); g.setTransform(k, 0, 0, 1, 0, 0);
        const W = N/k; g.beginPath(); g.rect(0, 0, W*(.12 + .8*f), N); g.clip();
        g.font = `700 ${Math.round(N*.095)}px Literata, Georgia, serif`; g.textAlign = 'center'; g.lineJoin = g.lineCap = 'round';
        g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = N*.013;
        lines.forEach((l, i) => g.strokeText(l, W/2, N*(.3 + .16*i)));
        g.restore(); tex.needsUpdate = true;
        if(f < 1) requestAnimationFrame(write);
      };
      write();
    } else if(PISTA === 'b'){
      const b = document.createElement('button'); b.type = 'button'; b.className = 'talo pista';
      b.innerHTML = `<span class="in" style="clip-path:${tear(9)}"><i>${fingerSvg}</i><span>Dibuixa al vidre</span></span>`;
      b.style.cssText = 'position:absolute;left:1rem;bottom:1rem;z-index:3;transform:rotate(-2deg);opacity:0;transition:opacity .5s';
      glass.appendChild(b); requestAnimationFrame(() => b.style.opacity = '1');
      b.addEventListener('click', () => { b.style.opacity = '0'; setTimeout(() => b.remove(), 500); if(touchy) enter(); else say('Passa el ratolí pel vidre', 2400); });
      glass.addEventListener('mousemove', () => { b.style.opacity = '0'; setTimeout(() => b.remove(), 500); }, {once: true});
    } else if(PISTA === 'c'){
      const tip = document.createElement('i');
      tip.style.cssText = 'display:block;position:absolute;left:0;top:0;width:2.6rem;height:2.6rem;margin:-1.3rem 0 0 -1.3rem;border-radius:50%;border:.2rem solid #F1EADC;box-shadow:.2rem .2rem 0 rgba(14,9,6,.85), inset 0 0 0 .5rem rgba(241,234,220,.25);pointer-events:none;opacity:0;transition:opacity .3s;z-index:3';
      glass.appendChild(tip);
      const t0 = performance.now() + 400, dur = 1800*slow; let prev: [number, number] | null = null;
      requestAnimationFrame(() => tip.style.opacity = '1');
      const run = () => {
        const f = Math.min(1, Math.max(0, (performance.now() - t0)/dur)), e = f < .5 ? 2*f*f : 1 - (-2*f + 2)**2/2;
        const u = .18 + .64*e, v = .55 + .14*Math.sin(e*Math.PI*2);
        tip.style.transform = `translate(${u*r.width}px, ${v*r.height}px)`;
        if(f > 0){ const p: [number, number] = [u*N, v*N]; stroke(prev ?? p, p); prev = p; }
        if(f < 1) requestAnimationFrame(run);
        else { tip.style.opacity = '0'; setTimeout(() => tip.remove(), 400); say(touchy ? 'Toca el vidre per dibuixar' : 'Passa el ratolí pel vidre', 2600); }
      };
      run();
    }
  }
  if(PISTA){   // when the hero has come in (the real one: only the first visit)
    const hero = document.getElementById('stage')!;
    const go = () => setTimeout(show, 900);
    if(hero.classList.contains('in')) go(); else new MutationObserver((_, o) => { if(hero.classList.contains('in')){ o.disconnect(); go(); } }).observe(hero, {attributes: true, attributeFilter: ['class']});
  }
  (window as unknown as {__vaho: () => number}).__vaho = () => { const d = g.getImageData(0, 0, N, N).data; let s = 0; for(let i = 0; i < d.length; i += 4) s += d[i]; return s/255; };
  // the mist coming back, and the runs
  function tick(){
    const now = performance.now(), dt = Math.min(.5, (now - lastT)/1000); lastT = now;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(0,0,0,${Math.min(1, 3*dt/back)})`; g.fillRect(0, 0, N, N);
    for(const d of drips){
      const l0 = d.len; d.len = Math.min(34*S, d.len + d.v*dt);
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = .9*S; g.beginPath(); g.moveTo(d.x, d.y + l0); g.lineTo(d.x + Math.sin((d.y + d.len)/S*.4)*.8*S, d.y + d.len); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(d.x, d.y + d.len, 1.1*S, 0, 7); g.fill();
    }
    drips = drips.filter(d => d.len < 34*S);
    tex.needsUpdate = true;
  }
  setInterval(tick, 120);
  return { tex, breath };
}
