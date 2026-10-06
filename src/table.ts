import { daylight, type Hour, type Rgb } from './light';
import { reduce, state } from './state';
import { byId, find } from './dom';
import TABLE_FRAG from './shaders/table.frag?raw';

// the table under the window: painted once in watercolor when it arrives, with the hero's pigment model,
// then left alone. The window's light, the shadows of the trees going past, the travel things and the
// train's shake live on top in SVG and CSS, so the GPU does not keep working once it is painted.
export interface Table { setTime(min: number): void }
// the window's light on the table, per hour: colour, strength and how far it slants
const LIGHT: Record<Hour, [color: string, alpha: number, skew: number]> = {dawn:['#FFC58A', .5, 150], day:['#FFF1CC', .42, 50], dusk:['#FF9F86', .46, -150], night:['#9FB2E8', .22, 0]};
// where things are on the table, in CSS px: the table's edges (top, bottom, far and near inset), the window
// above it (left, right, sill top and bottom), the aluminium lip, whether there are seats, the two hinges
interface Geometry { W: number; H: number; mobile: boolean; rem: number; strip: number;
  tbl: [number, number, number, number]; win: [number, number, number, number]; lip: number; seats: number; brk: [number, number] }
interface Box { x: number; y: number; w: number; h: number }

export function createTable(): Table {
  const esc = byId('escena'), cv = byId<HTMLCanvasElement>('lienzo');
  const gl = cv.getContext('webgl', {preserveDrawingBuffer:true, antialias:false, powerPreference:'low-power'});
  let prog: WebGLProgram | null = null, raf = 0, minute = 600, started = false, G: Geometry;
  if(gl){
    const sh = (type: number, src: string) => { const x = gl.createShader(type)!; gl.shaderSource(x, src); gl.compileShader(x); return x; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, TABLE_FRAG));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) prog = null;
    else {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
  }
  // where things are, from the layout (offsets, so the tilt of the shelf does not skew the measures)
  const mesa = find('.mesa', esc);
  function geometry(): Geometry {
    const W = esc.clientWidth, H = esc.clientHeight, mobile = W < 701, rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const strip = (mobile ? 3 : 4) * rem, left = mesa.offsetLeft;
    const far = mobile ? 6 : Math.max(1.5 * rem, left - 2.5 * rem), near = mobile ? 0 : Math.max(.5 * rem, left - 4.75 * rem);
    const winW = mobile ? W - 60 : Math.min(42.5 * rem, W * .47);
    return {W, H, mobile, rem, strip, tbl:[strip, mobile ? H + 400 : H - 2.6 * rem, far, near], win:[(W - winW) / 2, (W + winW) / 2, strip * .42, strip * .8],
            lip: mobile ? 0 : 1.1 * rem, seats: mobile ? 0 : 1, brk:[W * .23, W * .77]};
  }
  const box = (el: HTMLElement): Box => ({x: el.offsetLeft + mesa.offsetLeft, y: el.offsetTop + mesa.offsetTop, w: el.offsetWidth, h: el.offsetHeight});
  const put = (id: string, x: number, y: number, r = 0) => { const el = byId(id); el.style.left = x.toFixed(0) + 'px'; el.style.top = y.toFixed(0) + 'px'; (el.firstElementChild as HTMLElement | SVGElement).style.transform = `rotate(${r}deg)`; return el; };
  function layout(){
    G = geometry();
    const {W, H, mobile, strip, rem} = G, [wl, wr] = G.win, name = daylight(minute).name, [col, alpha, skew0] = LIGHT[name];
    const skew = skew0 * (mobile ? .3 : rem / 16), reach = mobile ? Math.min(H, 29 * rem) : strip + (H - strip) * .62;
    const pts = [[wl + 2.5 * rem, strip], [wr - 2.5 * rem, strip], [wr + 10 * rem + skew, reach], [wl - 8.75 * rem + skew, reach]];
    for(const id of ['luz', 'huellas']) byId(id).setAttribute('viewBox', `0 0 ${W} ${H}`);
    const haz = byId('haz'); haz.setAttribute('points', pts.map(p => p.join(',')).join(' ')); haz.setAttribute('fill', col);
    const bar = byId('travesano'); bar.setAttribute('y', String(strip + (reach - strip) * .34)); bar.setAttribute('height', mobile ? '7' : '16');
    byId<SVGElement>('luz').style.opacity = String(alpha);
    const sh = byId('sombras');
    sh.style.clipPath = `polygon(${pts.map(p => `${p[0]}px ${p[1]}px`).join(',')})`; sh.classList.toggle('bcn', state.dir === 'bcn');
    // travel things, next to the papers they share the table with
    const intro = box(find('.intro', esc)), introP = box(find('.intro p', esc)), fol = box(byId('folleto')), cua = box(byId('cuaderno')), rev = box(byId('reverso'));
    const mesaR = mesa.offsetLeft + mesa.offsetWidth;
    const cupW = byId('cafe').firstElementChild!.clientWidth || 7 * rem, penW = 11.9 * rem, tixW = 9.4 * rem;
    const oneColumn = getComputedStyle(mesa).gridTemplateColumns.trim().split(/\s+/).length === 1;
    if(oneColumn){
      // stacked papers: things go in the gaps, never over the text
      if(mobile) put('cafe', mesaR - cupW, introP.y + .2 * rem); else put('cafe', mesaR - cupW - .6 * rem, intro.y - .4 * rem);
      put('boli', fol.x + .5 * rem, fol.y + fol.h + .45 * rem, -4);
      put('rodalies', rev.x + rev.w - tixW - .6 * rem, rev.y - 1.9 * rem, 7);
      byId('gafas').hidden = true;
    } else {
      put('cafe', mesaR - cupW - .6 * rem, intro.y - .4 * rem); put('boli', cua.x + cua.w - 1.75 * penW, cua.y - 2.75 * rem, -7);
      put('rodalies', fol.x + 3.75 * rem, fol.y + fol.h - .9 * rem, 8);
      const g = byId('gafas'); g.hidden = rev.x + rev.w + 12.5 * rem > W - G.tbl[3]; put('gafas', rev.x + rev.w + 1.4 * rem, rev.y + 1.5 * rem, -9);
    }
    const cafe = byId('cafe');
    const c1 = byId('cerco1'), c2 = byId('cerco2');
    c1.setAttribute('cx', String(cafe.offsetLeft - 1.25 * rem)); c1.setAttribute('cy', String(cafe.offsetTop + 9.4 * rem)); c1.setAttribute('r', String(2.9 * rem));
    c2.setAttribute('cx', String(W * .44)); c2.setAttribute('cy', String(H - (mobile ? 180 : 6.9 * rem))); c2.setAttribute('r', String(2.1 * rem));
    const peg = byId('pegatina'); peg.setAttribute('transform', `translate(${Math.min(W - 24, wr + 3.75 * rem)} ${strip * .45}) scale(${rem / 16})`);
    ([['arana1', .43, .78, 140, -16], ['arana2', .62, .3, 110, 12], ['arana3', .2, .3, 90, -14]] as const).forEach(([id, x, y, l, d]) =>
      byId(id).setAttribute('d', `M${W * x} ${H * y} l${(mobile ? l * .6 : l) * rem / 16} ${d}`));
  }
  function draw(reveal: number){
    if(!gl || !prog) return;
    const u = (n: string) => gl.getUniformLocation(prog!, n), p = daylight(minute), k = cv.width / G.W;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(u('res'), cv.width, cv.height); gl.uniform1f(u('k'), k); gl.uniform1f(u('reveal'), reveal);
    gl.uniform4f(u('tbl'), ...G.tbl); gl.uniform4f(u('win'), ...G.win); gl.uniform1f(u('lip'), G.lip); gl.uniform1f(u('seats'), G.seats); gl.uniform2f(u('brk'), ...G.brk);
    for(const n of ['wallA', 'wallB', 'wood', 'seat'] as const) gl.uniform3f(u(n), ...(p[n] as Rgb));
    gl.uniform3f(u('hor'), ...p.hor);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  // the canvas follows the scene, at most 1.3 Mpx; a new size clears it
  function size(){
    const k = Math.min(1, Math.sqrt(1.3e6 / (G.W * G.H))), w = Math.max(2, Math.round(G.W * k)), h = Math.max(2, Math.round(G.H * k));
    if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  }
  function paint(animate: boolean){
    layout();
    if(!prog) return;
    size();
    cancelAnimationFrame(raf);
    if(!animate){ draw(1); cv.dataset.pintada = '1'; return; }
    const t0 = performance.now();
    const step = (t: number) => { const r = Math.min(1, (t - t0) / 3400); draw(r); if(r < 1) raf = requestAnimationFrame(step); else cv.dataset.pintada = '1'; };
    raf = requestAnimationFrame(step);
  }
  // paint it the first time the table comes into view; afterwards only repaint (instantly) on resize or a new hour
  new IntersectionObserver(([e]) => {
    esc.classList.toggle('dormida', !e.isIntersecting);
    if(e.isIntersecting && !started){ started = true; paint(!reduce); }
  }).observe(esc);
  let rs = 0;
  // a new size: repaint once it stops changing; a paint-in still under way carries on at the new size
  const resized = () => { clearTimeout(rs); rs = setTimeout(() => { if(!started) return; if(cv.dataset.pintada || !prog) paint(false); else { layout(); size(); } }, 200); };
  addEventListener('resize', resized);
  // the papers can settle after the table was measured (on a slow network the web fonts arrive later and the text
  // wraps anew): the travel things follow them at once, the painted table once the scene stops changing size
  const papers = new ResizeObserver(() => { if(!started) return; const {W, H} = G; layout(); if(G.W !== W || G.H !== H) resized(); });
  [esc, ...mesa.children].forEach(el => papers.observe(el));
  return {setTime(m: number){ const before = daylight(minute).name; minute = m; if(started && daylight(m).name !== before) paint(false); else if(started) layout(); }};
}
