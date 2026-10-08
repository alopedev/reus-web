import type { BufferGeometry } from 'three';
import { BoxGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, Float32BufferAttribute, Group, HemisphereLight, IcosahedronGeometry, InstancedMesh, LinearFilter, Mesh, MeshPhongMaterial, Object3D, OrthographicCamera, PerspectiveCamera, PlaneGeometry, RGBAFormat, Scene, ShaderMaterial, Vector2, Vector3, Vector4, WebGLRenderTarget, WebGLRenderer } from 'three';
import { daylight, type Hour } from './light';
import type { Weather } from './weather';
import watercolorFrag from './shaders/watercolor.frag?raw';

export interface World {
  frame(dx: number, time: number, reveal: number): void;   // move the landscape by dx and paint it
  setTime(min: number): Hour;                              // light it for a time of day
  resize(): void;
  setWash(foldY: number, shade: number): void;             // the pigment wash on the wall (see shelf.ts)
  setWeather(w: Weather): void;                            // the weather at home, in the window (see weather.ts)
  grain(): number;                                         // px of the landscape per px of the window (check.py)
}
// something scattered on the landscape: position, size, and turn around the vertical axis
type Placement = [x: number, y: number, z: number, size: [number, number, number], turn?: number];
// waves of a curve: amplitude, how many across, and how fast they change with depth
type Wave = [amp: number, k: number, p: number];

// the landscape through the window: a 3D scene rendered to a target, then painted in watercolor by the post
// pass, which also paints the carriage wall around the window. Returns null without WebGL
export function build3D(): World | null {
  const canvas = document.createElement('canvas'); canvas.id='gl'; canvas.setAttribute('aria-hidden','true');
  let renderer: WebGLRenderer;
  try{ renderer = new WebGLRenderer({canvas, antialias:false, powerPreference:'low-power'}); }catch(e){ return null; }
  if(!renderer.getContext()) return null;
  const hero = document.getElementById('hero')!; hero.prepend(canvas); hero.classList.add('pintada');
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.5, 5000);
  camera.position.set(0, 3.4, 0);
function rng(seed: number){ let s = seed>>>0; return ()=>{ s = (s*1664525 + 1013904223)>>>0; return s/4294967296; }; }
  const hemi = new HemisphereLight(0xffffff, 0x777766, .95); scene.add(hemi);
  const sun = new DirectionalLight(0xffffff, .8); scene.add(sun);
  const mat = (c: Color) => new MeshPhongMaterial({color:c, flatShading:true, shininess:0, specular:0x000000});
  const vmat = new MeshPhongMaterial({vertexColors:true, flatShading:true, shininess:0, specular:0x000000});
  const C = (h: number) => new Color(h);
  const pig = {sap:C(0x8D9A62), vine:C(0x74854A), olive:C(0x8C9960), ochre:C(0xC9A060), earth:C(0xB39478), sand:C(0xE4D6B6), sea:C(0x40708F), indigo:C(0x46507A), pine:C(0x4F6B3C), roof:C(0xB5705A), wall:C(0xEBE3D2), wave:C(0xDCE6EA)};

  const L = 240;
  function periodic(x: number, z: number, amps: Wave[]){ let y=0; amps.forEach(([a,k,p])=> y += a*Math.sin((x/L)*Math.PI*2*k + z*p)); return y; }
  function tile(seed: number){
    const r = rng(seed), g = new Group();
    const geo = new PlaneGeometry(L, 72, 80, 18); geo.rotateX(-Math.PI/2); geo.translate(L/2, 0, -37);
    const pos = geo.attributes.position, col: number[] = [];
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i), z=pos.getZ(i);
      pos.setY(i, z < -62 ? -0.2 : periodic(x, z, [[.35,3,.08],[.18,7,.2]]));
      let c; if(z < -62) c = pig.sand; else { const f = Math.floor(x/30) % 4; c = [pig.earth, pig.ochre, pig.sap, pig.earth][(f + (z< -30?1:0)) % 4]; }
      const k = .92 + r()*.16; col.push(c.r*k, c.g*k, c.b*k);
    }
    geo.setAttribute('color', new Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    g.add(new Mesh(geo, vmat));
    const dummy = new Object3D();
    function instanced(geom: BufferGeometry, color: Color, list: Placement[], jitter=.12){
      const m = new InstancedMesh(geom, mat(color), list.length);
      list.forEach((t,i)=>{ dummy.position.set(t[0],t[1],t[2]); dummy.rotation.set(0,t[4]||0,0); dummy.scale.set(t[3][0],t[3][1],t[3][2]); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
        const c = new Color(color); c.offsetHSL(0, 0, (r()-.5)*jitter); m.setColorAt(i, c); });
      g.add(m);
    }
    const olives: Placement[] = [], trunks: Placement[] = [];
    for(let i=0;i<30;i++){ const x=r()*L, z=-19-r()*32, s=.8+r()*.6; olives.push([x, 1.9*s, z, [1.3*s,.95*s,1.3*s], r()*3]); trunks.push([x, .8*s, z, [s,s,s]]); }
    instanced(new IcosahedronGeometry(1.5,0), pig.olive, olives, .18);
    instanced(new CylinderGeometry(.16,.24,1.6,5), pig.earth.clone().multiplyScalar(.6), trunks);
    const vines: Placement[] = [];
    [[0,70],[88,150],[168,236]].forEach(([a,b])=>{ for(let z=-5.5; z>-17; z-=1.7) for(let x=a; x<b; x+=1.4) vines.push([x+r()*.3, .6, z, [1, .9+r()*.5, .9]]); });
    instanced(new IcosahedronGeometry(.55,0), pig.vine, vines, .2);
    const pines: Placement[] = [], ptr: Placement[] = [];
    for(let i=0;i<9;i++){ const x=r()*L, z=-54-r()*7, s=.9+r()*.4; pines.push([x, 6.2*s, z, [2.8*s,.8*s,2.8*s], r()*3]); ptr.push([x, 3*s, z, [s, s, s]]); }
    instanced(new IcosahedronGeometry(1.6,0), pig.pine, pines, .12);
    instanced(new CylinderGeometry(.18,.26,6,5), pig.earth.clone().multiplyScalar(.55), ptr);
    for(let i=0;i<3;i++){
      const x = 30 + i*80 + r()*20, z = -34 - r()*14, w = 6+r()*3;
      const house = new Mesh(new BoxGeometry(w, 4, 5), mat(pig.wall)); house.position.set(x, 2, z); g.add(house);
      const roof = new Mesh(new ConeGeometry(w*.72, 2.2, 4), mat(pig.roof)); roof.position.set(x, 5.1, z); roof.rotation.y = Math.PI/4; roof.scale.set(1,1,.8); g.add(roof);
    }
    const waves: Placement[] = [];
    for(let i=0;i<60;i++) waves.push([r()*L, .32, -75-r()*160, [4+r()*10, 1, 1]]);
    instanced(new BoxGeometry(1,.05,.35), pig.wave, waves, .05);
    return g;
  }
  const tiles = [tile(7), tile(7)]; tiles.forEach(t=>scene.add(t));
  const sea = new Mesh(new PlaneGeometry(8000, 2400), mat(pig.sea)); sea.rotation.x = -Math.PI/2; sea.position.set(0, .25, -1270); scene.add(sea);
  function ridge(width: number, z: number, base: number, amps: [amp: number, k: number][], color: Color, segs: number){
    const geo = new PlaneGeometry(width, 1, segs, 1); const p = geo.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i)+width/2; if(p.getY(i)>0){ let y=base; amps.forEach(([a,k])=> y += a*Math.sin(x/width*Math.PI*2*k + k)); p.setY(i, y); } else p.setY(i, -40); }
    geo.translate(width/2, 0, 0); geo.computeVertexNormals();
    const m = new Mesh(geo, mat(color)); m.position.z = z; return m;
  }
  const RW = 3600;
  const headlands = [0,1].map(()=> ridge(RW, -1700, 40, [[55,2],[25,5],[10,11]], pig.indigo, 180));
  headlands.forEach(m=>scene.add(m));


  const rt = new WebGLRenderTarget(2, 2, {format:RGBAFormat, minFilter:LinearFilter, magFilter:LinearFilter});
  const post = new ShaderMaterial({
    uniforms:{ tScene:{value:rt.texture}, res:{value:new Vector2(1,1)}, sres:{value:new Vector2(1,1)}, tq:{value:0}, reveal:{value:1},
      skyTop:{value:new Vector3()}, skyHor:{value:new Vector3()}, sunCol:{value:new Vector3()}, sunPos:{value:new Vector2()}, sunA:{value:.85},
      aspect:{value:1}, waspect:{value:1}, hor:{value:.42}, win:{value:new Vector4(.2,.3,.8,.8)}, wrad:{value:.04}, seats:{value:1},
      wallA:{value:new Vector3()}, wallB:{value:new Vector3()}, wood:{value:new Vector3()}, seat:{value:new Vector3()},
      foldY:{value:0}, shade:{value:0}, wx:{value:0} },
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
    fragmentShader: watercolorFrag,
  });
  const postScene = new Scene(), postCam = new OrthographicCamera(-1,1,1,-1,0,1);
  postScene.add(new Mesh(new PlaneGeometry(2,2), post));
  const U = post.uniforms;
  // the stacked hero (phones, portrait tablets; the same media query as hero.css) has a small window: its landscape
  // is painted twice as fine, since the brush strokes are sized in the target's pixels and would read as pixels there
  const STACKED = matchMedia('(max-width:700px), (max-aspect-ratio:4/5)');
  let grain = 0;
  function resize(){
    const cw = innerWidth, ch = innerHeight;
    let s = Math.min(devicePixelRatio||1, 1.25);
    const cap = 1.5e6; if(cw*ch*s*s > cap) s = Math.sqrt(cap/(cw*ch));
    const W = Math.max(2, Math.round(cw*s)), H = Math.max(2, Math.round(ch*s));
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    U.sres.value.set(W, H); U.aspect.value = W/H;
    const win = document.getElementById('win')!, r = win.getBoundingClientRect();
    U.win.value.set(r.left/cw, 1-r.bottom/ch, r.right/cw, 1-r.top/ch);
    U.wrad.value = parseFloat(getComputedStyle(win).borderTopLeftRadius)/ch;
    U.seats.value = (cw/ch > 1.15 && r.left > cw*.12) ? 1 : 0;
    const k = s * .8 * (STACKED.matches ? 2 : 1);
    const rw = Math.max(2, Math.round(r.width*k)), rh = Math.max(2, Math.round(r.height*k));
    grain = rw / Math.max(1, r.width);
    rt.setSize(rw, rh); U.res.value.set(rw, rh);
    const wa = r.width/Math.max(1,r.height); U.waspect.value = wa;
    camera.aspect = wa; camera.fov = wa < 1.3 ? 50 : 40;
    const hor = .42; U.hor.value = hor;
    const vfov = camera.fov*Math.PI/180;
    camera.rotation.set(Math.atan(Math.tan(vfov/2)*(1-2*hor)), 0, 0);
    camera.updateProjectionMatrix();
  }
  function setTime(min: number){
    const p = daylight(min);
    U.skyTop.value.set(...p.top); U.skyHor.value.set(...p.hor); U.sunCol.value.set(...p.sun); U.sunPos.value.set(...p.sunUV); U.sunA.value = p.glow;
    U.wallA.value.set(...p.wallA); U.wallB.value.set(...p.wallB); U.wood.value.set(...p.wood); U.seat.value.set(...p.seat);
    hemi.color.set(p.hemi[0]); hemi.groundColor.set(p.hemi[1]); hemi.intensity = p.hemi[2];
    sun.color.set(p.dir[0]); sun.intensity = p.dir[1]; sun.position.set(...p.dir[2]);
    // Safari on iPhone paints the strip around the Dynamic Island in one flat colour, read at load: the top edge of
    // the painted wall, wallA under the luggage rack's shadow (×.9), the corners' shade averaged across the width
    // (×.94) and the watercolour's pigment (×.89, measured on an iPhone). Safari 26 takes it from the body (a fixed
    // element with its own background would win, and a faded band of that colour came out darker); Safari 18 and
    // earlier from theme-color
    const top = `rgb(${p.wallA.map(v=>Math.round(v*.75*255)).join(',')})`;
    document.body.style.background = top;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', top);
    return p.name;
  }
  let offset = 0;
  function frame(dx: number, time: number, reveal: number){
    offset += dx;
    const tx = -(((offset % L)+L) % L); tiles[0].position.x = tx - L/2; tiles[1].position.x = tx + L/2;
    const hx = -(((offset % RW)+RW) % RW); headlands[0].position.x = hx - RW/2; headlands[1].position.x = hx + RW/2;
    U.tq.value = time; U.reveal.value = reveal;
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  }
  // the wash follows the scroll directly (no smoothing of its own). It must show even when the loop is not
  // running (paused, or before the landscape starts), so it redraws just the post pass over the scene
  // already in the render target, at most once per frame however many scroll events arrive
  let washRaf = 0;
  function setWash(foldY: number, shade: number){
    U.foldY.value = foldY; U.shade.value = shade;
    if(!washRaf) washRaf = requestAnimationFrame(() => { washRaf = 0; renderer.setRenderTarget(null); renderer.render(postScene, postCam); });
  }
  resize(); addEventListener('resize', resize);
  // 0 fair, 1 overcast, 2 rain (drops on the glass), 3 fog: the shader's wx
  function setWeather(w: Weather){ U.wx.value = ['clear', 'cloudy', 'rain', 'fog'].indexOf(w); }
  return {frame, setTime, resize, setWash, setWeather, grain: () => grain};
}
