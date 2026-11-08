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
  // a finger, without taking the page's scroll: the glass lets the browser scroll up and down (touch-action: pan-y), so
  // a stroke that starts sideways draws at once and one that starts up or down scrolls; a finger held still for a moment
  // draws in any direction (from then on its moves are ours: preventDefault before any scroll has begun)
  const glass = document.getElementById('win')!;
  glass.style.touchAction = 'pan-y';
  glass.style.setProperty('-webkit-user-select', 'none'); glass.style.setProperty('-webkit-touch-callout', 'none'); glass.style.userSelect = 'none';
  let t0: {x: number, y: number} | null = null, mode: 'wait' | 'draw' | 'scroll' = 'wait', hold = 0;
  const pt = (t: Touch) => ({clientX: t.clientX, clientY: t.clientY} as PointerEvent);
  glass.addEventListener('touchstart', e => {
    if(e.touches.length > 1){ mode = 'scroll'; return; }
    const t = e.touches[0]; t0 = {x: t.clientX, y: t.clientY}; mode = 'wait'; last = null;
    clearTimeout(hold);
    hold = window.setTimeout(() => { if(mode === 'wait'){ mode = 'draw'; move(pt(t)); } }, 260);   // held still: a breath on the glass
  }, {passive: false});
  glass.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if(mode === 'wait' && t0){
      const dx = t.clientX - t0.x, dy = t.clientY - t0.y;
      if(Math.hypot(dx, dy) < 8) return;
      clearTimeout(hold);
      mode = Math.abs(dx) > Math.abs(dy) ? 'draw' : 'scroll';
      if(mode === 'draw') move(pt({clientX: t0.x, clientY: t0.y} as Touch));
    }
    if(mode === 'draw'){ e.preventDefault(); move(pt(t)); }
  }, {passive: false});
  const end = () => { clearTimeout(hold); mode = 'wait'; t0 = null; last = null; };
  glass.addEventListener('touchend', end); glass.addEventListener('touchcancel', end);
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
  return { tex };
}
