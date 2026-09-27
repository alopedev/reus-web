import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import DATA from '../data/trains.json';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
function madridNow(){
  const p = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  const g = t => p.find(x=>x.type===t).value;
  return {date:`${g('year')}-${g('month')}-${g('day')}`, min:(+g('hour'))*60+(+g('minute'))};
}
const addDays = (iso,n) => { const d=new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
const weekday = iso => new Date(iso+'T12:00:00Z').getUTCDay();
const hhmm = m => { m=((m%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
const dur = m => { if(m<1) return 'ahora'; const h=Math.floor(m/60), r=m%60; return h?(r?`${h} h ${r} min`:`${h} h`):`${r} min`; };

/* one light drives the landscape and the carriage it shines into */
function daylight(min){
  const h = min/60;
  if(h<7 || h>=21) return {name:'night', top:[.20,.24,.40], hor:[.42,.46,.62], sun:[.95,.94,.86], sunUV:[.82,.84], hemi:[0x7080b0,0x202433,.55], dir:[0xaab8e0,.35,[-.3,.8,.4]],
    wallA:[.27,.27,.35], wallB:[.17,.17,.24], wood:[.15,.13,.16], seat:[.09,.09,.12]};
  if(h<10) return {name:'dawn', top:[.78,.64,.56], hor:[.95,.83,.66], sun:[.95,.62,.36], sunUV:[.8,.5], hemi:[0xf2d9c2,0x6b5a45,.8], dir:[0xffc690,.9,[.6,.35,.5]],
    wallA:[.66,.53,.45], wallB:[.46,.35,.30], wood:[.36,.25,.20], seat:[.21,.19,.21]};
  if(h<18) return {name:'day', top:[.52,.66,.78], hor:[.88,.91,.90], sun:[.97,.82,.46], sunUV:[.82,.82], hemi:[0xe3ecf2,0x7d6e4d,.85], dir:[0xfff3de,.85,[.4,.9,.5]],
    wallA:[.60,.52,.42], wallB:[.42,.35,.27], wood:[.34,.25,.18], seat:[.19,.20,.21]};
  return {name:'dusk', top:[.60,.44,.60], hor:[.96,.72,.56], sun:[.96,.55,.32], sunUV:[.8,.46], hemi:[0xf0c7c7,0x5a4a52,.75], dir:[0xff9f7a,.8,[-.6,.3,.5]],
    wallA:[.58,.44,.41], wallB:[.39,.29,.28], wood:[.31,.21,.19], seat:[.19,.16,.19]};
}

function build3D(){
  const canvas = document.createElement('canvas'); canvas.id='gl'; canvas.setAttribute('aria-hidden','true');
  let renderer;
  try{ renderer = new THREE.WebGLRenderer({canvas, antialias:false, powerPreference:'low-power'}); }catch(e){ return null; }
  if(!renderer.getContext()) return null;
  document.getElementById('hero').prepend(canvas); document.getElementById('hero').classList.add('pintada');
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 5000);
  camera.position.set(0, 3.4, 0);
function rng(seed){ let s = seed>>>0; return ()=>{ s = (s*1664525 + 1013904223)>>>0; return s/4294967296; }; }
  const hemi = new THREE.HemisphereLight(0xffffff, 0x777766, .95); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, .8); scene.add(sun);
  const mat = c => new THREE.MeshPhongMaterial({color:c, flatShading:true, shininess:0, specular:0x000000});
  const vmat = new THREE.MeshPhongMaterial({vertexColors:true, flatShading:true, shininess:0, specular:0x000000});
  const C = h => new THREE.Color(h);
  const pig = {sap:C(0x8D9A62), vine:C(0x74854A), olive:C(0x8C9960), ochre:C(0xC9A060), earth:C(0xB39478), sand:C(0xE4D6B6), sea:C(0x40708F), indigo:C(0x46507A), pine:C(0x4F6B3C), roof:C(0xB5705A), wall:C(0xEBE3D2), wave:C(0xDCE6EA)};

  const L = 240;
  function periodic(x, z, amps){ let y=0; amps.forEach(([a,k,p])=> y += a*Math.sin((x/L)*Math.PI*2*k + z*p)); return y; }
  function tile(seed){
    const r = rng(seed), g = new THREE.Group();
    const geo = new THREE.PlaneGeometry(L, 72, 80, 18); geo.rotateX(-Math.PI/2); geo.translate(L/2, 0, -37);
    const pos = geo.attributes.position, col = [];
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i), z=pos.getZ(i);
      pos.setY(i, z < -62 ? -0.2 : periodic(x, z, [[.35,3,.08],[.18,7,.2]]));
      let c; if(z < -62) c = pig.sand; else { const f = Math.floor(x/30) % 4; c = [pig.earth, pig.ochre, pig.sap, pig.earth][(f + (z< -30?1:0)) % 4]; }
      const k = .92 + r()*.16; col.push(c.r*k, c.g*k, c.b*k);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, vmat));
    const dummy = new THREE.Object3D();
    function instanced(geom, color, list, jitter=.12){
      const m = new THREE.InstancedMesh(geom, mat(color), list.length);
      list.forEach((t,i)=>{ dummy.position.set(t[0],t[1],t[2]); dummy.rotation.set(0,t[4]||0,0); dummy.scale.set(t[3][0],t[3][1],t[3][2]); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
        const c = new THREE.Color(color); c.offsetHSL(0, 0, (r()-.5)*jitter); m.setColorAt(i, c); });
      g.add(m);
    }
    const olives=[], trunks=[];
    for(let i=0;i<30;i++){ const x=r()*L, z=-19-r()*32, s=.8+r()*.6; olives.push([x, 1.9*s, z, [1.3*s,.95*s,1.3*s], r()*3]); trunks.push([x, .8*s, z, [s,s,s]]); }
    instanced(new THREE.IcosahedronGeometry(1.5,0), pig.olive, olives, .18);
    instanced(new THREE.CylinderGeometry(.16,.24,1.6,5), pig.earth.clone().multiplyScalar(.6), trunks);
    const vines=[];
    [[0,70],[88,150],[168,236]].forEach(([a,b])=>{ for(let z=-5.5; z>-17; z-=1.7) for(let x=a; x<b; x+=1.4) vines.push([x+r()*.3, .6, z, [1, .9+r()*.5, .9]]); });
    instanced(new THREE.IcosahedronGeometry(.55,0), pig.vine, vines, .2);
    const pines=[], ptr=[];
    for(let i=0;i<9;i++){ const x=r()*L, z=-54-r()*7, s=.9+r()*.4; pines.push([x, 6.2*s, z, [2.8*s,.8*s,2.8*s], r()*3]); ptr.push([x, 3*s, z, [s, s, s]]); }
    instanced(new THREE.IcosahedronGeometry(1.6,0), pig.pine, pines, .12);
    instanced(new THREE.CylinderGeometry(.18,.26,6,5), pig.earth.clone().multiplyScalar(.55), ptr);
    for(let i=0;i<3;i++){
      const x = 30 + i*80 + r()*20, z = -34 - r()*14, w = 6+r()*3;
      const house = new THREE.Mesh(new THREE.BoxGeometry(w, 4, 5), mat(pig.wall)); house.position.set(x, 2, z); g.add(house);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w*.72, 2.2, 4), mat(pig.roof)); roof.position.set(x, 5.1, z); roof.rotation.y = Math.PI/4; roof.scale.set(1,1,.8); g.add(roof);
    }
    const waves=[];
    for(let i=0;i<60;i++) waves.push([r()*L, .32, -75-r()*160, [4+r()*10, 1, 1]]);
    instanced(new THREE.BoxGeometry(1,.05,.35), pig.wave, waves, .05);
    return g;
  }
  const tiles = [tile(7), tile(7)]; tiles.forEach(t=>scene.add(t));
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(8000, 2400), mat(pig.sea)); sea.rotation.x = -Math.PI/2; sea.position.set(0, .25, -1270); scene.add(sea);
  function ridge(width, z, base, amps, color, segs){
    const geo = new THREE.PlaneGeometry(width, 1, segs, 1); const p = geo.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i)+width/2; if(p.getY(i)>0){ let y=base; amps.forEach(([a,k])=> y += a*Math.sin(x/width*Math.PI*2*k + k)); p.setY(i, y); } else p.setY(i, -40); }
    geo.translate(width/2, 0, 0); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(color)); m.position.z = z; return m;
  }
  const RW = 3600;
  const headlands = [0,1].map(()=> ridge(RW, -1700, 40, [[55,2],[25,5],[10,11]], pig.indigo, 180));
  headlands.forEach(m=>scene.add(m));


  const rt = new THREE.WebGLRenderTarget(2, 2, {format:THREE.RGBAFormat, minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter});
  const post = new THREE.ShaderMaterial({
    uniforms:{ tScene:{value:rt.texture}, res:{value:new THREE.Vector2(1,1)}, sres:{value:new THREE.Vector2(1,1)}, tq:{value:0}, reveal:{value:1},
      skyTop:{value:new THREE.Vector3()}, skyHor:{value:new THREE.Vector3()}, sunCol:{value:new THREE.Vector3()}, sunPos:{value:new THREE.Vector2()},
      aspect:{value:1}, waspect:{value:1}, hor:{value:.42}, win:{value:new THREE.Vector4(.2,.3,.8,.8)}, wrad:{value:.04}, seats:{value:1},
      wallA:{value:new THREE.Vector3()}, wallB:{value:new THREE.Vector3()}, wood:{value:new THREE.Vector3()}, seat:{value:new THREE.Vector3()},
      foldY:{value:0}, shade:{value:0} },
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
    fragmentShader:`
      precision highp float;
      uniform sampler2D tScene; uniform vec2 res, sres; uniform float tq, reveal, aspect, waspect, hor, wrad, seats, foldY, shade;
      uniform vec3 skyTop, skyHor, sunCol, wallA, wallB, wood, seat; uniform vec2 sunPos; uniform vec4 win;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
      float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
      float sdRR(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
      vec4 quad(vec2 uv, vec2 dir, out float var){
        vec2 px = 1./res; vec4 m = vec4(0.); vec3 s = vec3(0.);
        for(int j=0;j<3;j++) for(int i=0;i<3;i++){ vec4 c = texture2D(tScene, uv + vec2(float(i),float(j))*dir*px*1.6); m += c; s += c.rgb*c.rgb; }
        m /= 9.; s /= 9.; s = abs(s - m.rgb*m.rgb); var = s.r+s.g+s.b; return m;
      }
      vec4 kuwahara(vec2 uv){
        float v0,v1,v2,v3;
        vec4 a=quad(uv,vec2(-1.,-1.),v0), b=quad(uv,vec2(1.,-1.),v1), c=quad(uv,vec2(1.,1.),v2), d=quad(uv,vec2(-1.,1.),v3);
        vec4 r=a; float mv=v0; if(v1<mv){mv=v1;r=b;} if(v2<mv){mv=v2;r=c;} if(v3<mv){mv=v3;r=d;} return r;
      }
      vec3 sky(vec2 w, float t){
        float hy = clamp((w.y-hor)/(1.-hor),0.,1.);
        vec3 s = mix(skyHor, skyTop, pow(hy,.75));
        s = mix(s, s*.88, fbm(w*vec2(2.2,1.6)+vec2(t*.02,0.))*.75);
        vec2 d = (w - sunPos)*vec2(waspect,1.);
        float rr = length(d) + (fbm(d*10.+t)-.5)*.02;
        return mix(s, sunCol, smoothstep(.09,.08,rr)*.85);
      }
      // what the window shows, before it becomes paint
      vec3 outside(vec2 w, float t, out float e, out float pen){
        vec2 wo = vec2(fbm(w*vec2(7.,5.)+t*1.7), fbm(w*vec2(6.,8.)-t*1.3)) - .5;
        vec2 s = w + wo*.006;
        vec4 k = kuwahara(s);
        float a = smoothstep(.3,.7,k.a);
        vec3 obj = k.rgb/max(k.a,.001);
        float lum = dot(obj, vec3(.299,.587,.114));
        obj = mix(vec3(lum), obj, .8); obj = mix(obj, vec3(1.), .1);
        vec2 px = 1./res;
        vec4 bl = (texture2D(tScene,s+vec2(4.,1.)*px)+texture2D(tScene,s-vec2(4.,1.)*px)+texture2D(tScene,s+vec2(-1.,4.)*px)+texture2D(tScene,s-vec2(-1.,4.)*px))*.25;
        e = smoothstep(.06,.35,length(k-bl)); pen = smoothstep(.55,1.,e)*.2;
        return mix(sky(w,t), obj, a);
      }
      float ring(float sd, float w){ return 1. - smoothstep(0., w, abs(sd)); }

      void main(){
        vec2 uv = vUv, t2 = vec2(tq);
        float t = tq;
        vec2 P = uv*vec2(aspect,1.);
        vec2 wc = (win.xy+win.zw)*.5, wh = (win.zw-win.xy)*.5;
        vec2 wobble = (vec2(fbm(uv*vec2(16.,11.)+3.), fbm(uv*vec2(12.,17.)-5.))-.5)*.006;   // hand-painted edges
        float sdW = sdRR((uv+wobble-wc)*vec2(aspect,1.), wh*vec2(aspect,1.), wrad);
        float fw = .022;
        vec3 col; float edge = 0., pen = 0., order;

        if(sdW < 0.){
          vec2 w = (uv - win.xy)/(win.zw - win.xy);
          float e;
          col = outside(w, t, e, pen);
          edge = e*.35;
          // the sash bar across the glass, and a faint reflection
          float bar = ring(w.y-.64, .012*(1.+.3*noise(uv*80.)));
          col = mix(col, wood*.9, bar*.9);
          col = mix(col, vec3(1.), .06*smoothstep(.2,.9,w.x-w.y+.5)*(1.-smoothstep(.0,.3,abs(w.x-w.y-.1))));
          order = .45 + (w.y > hor ? (1.-w.y)/(1.-hor)*.24 : .24 + (hor-w.y)/hor*.3) + (fbm(w*vec2(3.,4.)+3.1)-.5)*.25;
        } else {
          // the carriage wall, lit by the window
          float y = uv.y;
          float dado = win.y - .07;
          vec3 wall = mix(wallB, wallA, smoothstep(dado-.004, dado+.004, y + wobble.y));
          wall *= .9 + .12*smoothstep(1., .55, y);                         // shadow under the luggage rack
          float glow = exp(-max(sdW,0.)*7.);
          wall = mix(wall, wall*(1.-0.3) + skyHor*.45, glow*.35);             // daylight spilling onto the wall
          wall *= .82 + .18*smoothstep(0.,.35,uv.x)*smoothstep(1.,.65,uv.x); // corners fall into shade
          col = wall;
          // panelling on the lower wall
          float seam = ring(fract(P.x*3.2)-.5, .004) * step(y, dado);
          col = mix(col, col*.8, seam*.6);
          // rail and shelf under the window
          float rail = ring(y-dado, .006);
          col = mix(col, wood, rail);
          float shelfSd = sdRR((uv+wobble-vec2(wc.x, win.y-.032))*vec2(aspect,1.), vec2(wh.x*aspect+.05, .011), .006);
          float shelf = 1.-smoothstep(0.,.003,shelfSd);
          col = mix(col, mix(wood, wood*1.35, smoothstep(-.011,.004,(uv.y-(win.y-.032)))), shelf);
          // window frame: a thick wooden surround with a lit inner lip
          float frame = 1.-smoothstep(fw-.002, fw, sdW);
          vec3 fcol = mix(wood*1.25, wood*.75, smoothstep(0., fw, sdW));
          col = mix(col, fcol, frame);
          col = mix(col, col*.7, ring(sdW-fw, .006)*.8);                     // shadow cast by the frame
          // seats, only where there is room at the sides
          if(seats > .5){
            vec2 q = vec2(min(uv.x, 1.-uv.x)*aspect, uv.y);
            float sdS = sdRR(q - vec2(.02, .28), vec2(.2, .4), .09) + (fbm(uv*9.)-.5)*.02;
            float sm = 1.-smoothstep(0.,.004,sdS);
            vec3 sc = seat*(.85+.3*smoothstep(.1,.6,uv.y)) + skyHor*.06*glow;
            sc = mix(sc, sc*.65, ring(uv.y-.44, .004));                       // cushion seam
            col = mix(col, sc, sm);
            edge += ring(sdS, .006)*.6;
          }
          edge += ring(sdW-fw, .005)*.5 + ring(y-dado, .005)*.3 + ring(shelfSd,.005)*.5;
          order = (1.-uv.y)*.25 + (fbm(uv*vec2(3.,2.)+7.)-.5)*.3;
        }

        // the wall's shadow as it turns away from the light: a pigment wash that starts at the hinge (foldY)
        // and climbs the whole wall, window included, as the wall turns (shade); it deepens as it climbs.
        // Its front is one continuous line roughened by 2D noise, so it advances unevenly by zone, and
        // darker and grainier at its rim, like a real wash
        float washTop = foldY + shade*(1.08 - foldY);
        float washD = uv.y - washTop - (fbm(uv*vec2(9.,6.)*vec2(aspect,1.) + 4.7) - .5)*.11;
        float wash = (1. - smoothstep(-.04, .04, washD)) * step(.001, shade);
        col *= mix(vec3(1.), vec3(.42,.38,.35), wash*(.35 + .65*shade));
        edge += ring(washD, .03)*wash*.8;

        // paint it: absorbance, uneven density, granulation, darker edges, paper
        float wet = clamp((reveal*1.3 - order)/.16, 0., 1.);
        float front = wet*(1.-wet)*4.;
        vec3 A = 1. - col;
        A *= .86 + .3*fbm(uv*vec2(3.5,2.5)*vec2(aspect,1.)+11.);
        A *= 1. + (noise(uv*sres*.4)-.5)*(sdW<0.?.35:.18)*smoothstep(.1,.6,dot(A,vec3(.333)));
        A *= 1. + edge*.4;
        A *= mix(.25, 1., wet) * (1. + front*.9) * step(.001, wet+front);
        vec3 paper = vec3(.94,.93,.90) * (.965 + .06*fbm(uv*sres*.09));
        vec3 c = paper * (1. - clamp(A,0.,1.));
        c *= 1. - pen*wet*vec3(.62,.6,.55);
        gl_FragColor = vec4(c, 1.);
      }`
  });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), post));
  const U = post.uniforms;
  function resize(){
    const cw = innerWidth, ch = innerHeight;
    let s = Math.min(devicePixelRatio||1, 1.25);
    const cap = 1.5e6; if(cw*ch*s*s > cap) s = Math.sqrt(cap/(cw*ch));
    const W = Math.max(2, Math.round(cw*s)), H = Math.max(2, Math.round(ch*s));
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    U.sres.value.set(W, H); U.aspect.value = W/H;
    const r = document.getElementById('win').getBoundingClientRect();
    U.win.value.set(r.left/cw, 1-r.bottom/ch, r.right/cw, 1-r.top/ch);
    U.wrad.value = parseFloat(getComputedStyle(document.getElementById('win')).borderTopLeftRadius)/ch;
    U.seats.value = (cw/ch > 1.15 && r.left > cw*.12) ? 1 : 0;
    const rw = Math.max(2, Math.round(r.width*s*.8)), rh = Math.max(2, Math.round(r.height*s*.8));
    rt.setSize(rw, rh); U.res.value.set(rw, rh);
    const wa = r.width/Math.max(1,r.height); U.waspect.value = wa;
    camera.aspect = wa; camera.fov = wa < 1.3 ? 50 : 40;
    const hor = .42; U.hor.value = hor;
    const vfov = camera.fov*Math.PI/180;
    camera.rotation.set(Math.atan(Math.tan(vfov/2)*(1-2*hor)), 0, 0);
    camera.updateProjectionMatrix();
  }
  function setTime(min){
    const p = daylight(min);
    U.skyTop.value.set(...p.top); U.skyHor.value.set(...p.hor); U.sunCol.value.set(...p.sun); U.sunPos.value.set(...p.sunUV);
    U.wallA.value.set(...p.wallA); U.wallB.value.set(...p.wallB); U.wood.value.set(...p.wood); U.seat.value.set(...p.seat);
    hemi.color.set(p.hemi[0]); hemi.groundColor.set(p.hemi[1]); hemi.intensity = p.hemi[2];
    sun.color.set(p.dir[0]); sun.intensity = p.dir[1]; sun.position.set(...p.dir[2]);
    document.body.style.background = `rgb(${p.wallB.map(v=>Math.round(v*255)).join(',')})`;
    return p.name;
  }
  let offset = 0;
  function frame(dx, time, reveal){
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
  function setWash(foldY, shade){
    U.foldY.value = foldY; U.shade.value = shade;
    if(!washRaf) washRaf = requestAnimationFrame(() => { washRaf = 0; renderer.setRenderTarget(null); renderer.render(postScene, postCam); });
  }
  resize(); addEventListener('resize', resize);
  return {frame, setTime, resize, setWash};
}

const world = build3D();

// the table under the window: painted once in watercolor when it arrives, with the hero's pigment model,
// then left alone. The window's light, the shadows of the trees going past, the travel things and the
// train's shake live on top in SVG and CSS, so the GPU does not keep working once it is painted.
const TABLE_FRAG = `
precision highp float;
uniform vec2 res, brk; uniform float k, reveal, lip, seats;
uniform vec4 tbl, win; uniform vec3 wallA, wallB, wood, seat, hor;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
float ring(float d, float w){ return 1. - smoothstep(0., w, abs(d)); }
float sdBox(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
void main(){
  vec2 R = res / k;
  vec2 px = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / k;
  vec2 wob = (vec2(fbm(px*.011+3.), fbm(px*.013-5.)) - .5) * 5.;
  vec2 q = px + wob;
  float t = clamp((q.y - tbl.x) / (tbl.y - tbl.x), 0., 1.);
  float Lx = mix(tbl.z, tbl.w, t), Rx = R.x - Lx;
  float d = min(min(q.x - Lx, Rx - q.x), min(q.y - tbl.x, tbl.y - q.y));
  vec3 col; float edge = 0., order;
  if(d > 0.){
    // laminate: wood grain running along the table, lit from the window side
    float g = fbm(vec2(q.x*.0022, q.y*.05) + 7.);
    float lines = .5 + .5*sin(q.y*.11 + g*10.);
    col = wood*1.45 * (.86 + .26*g) * (.93 + .1*lines);
    col = mix(col, col*1.12 + hor*.1, smoothstep(tbl.x + 300., tbl.x, q.y)*.7);
    col *= .9 + .1*smoothstep(0., 70., d);
    // the two hinge plates where the table meets the wall
    float b1 = sdBox(q - vec2(brk.x, tbl.x + 12.), vec2(26., 8.), 3.), b2 = sdBox(q - vec2(brk.y, tbl.x + 12.), vec2(26., 8.), 3.);
    float bm = 1. - smoothstep(0., 1.5, min(b1, b2));
    col = mix(col, vec3(.62,.61,.58)*(.85 + .3*hor), bm);
    edge += ring(min(b1, b2), 1.2)*.7 + ring(d, 1.6)*.6;
    order = .15 + (q.y / R.y)*.35 + (fbm(q*.004 + 2.) - .5)*.3;
  } else if(q.y > tbl.y && q.y < tbl.y + lip && q.x > tbl.w - 6. && q.x < R.x - tbl.w + 6.){
    // the aluminium lip: the table's thickness, seen at the near edge
    float f = (q.y - tbl.y) / lip;
    col = mix(vec3(.80,.79,.75), vec3(.40,.39,.38), smoothstep(.1, 1., f)) * (.85 + .2*hor);
    col = mix(col, vec3(.97), ring(f - .15, .07)*.7);
    edge += ring(q.y - tbl.y - lip, 1.5);
    order = .55;
  } else if(q.y < tbl.x){
    // the wall under the window, and the bottom of the window with the fields going past
    col = wallB;
    col = mix(col, wood*1.1, ring(q.y - (tbl.x - 6.), 3.));
    if(q.x > win.x && q.x < win.y && q.y < win.w){
      if(q.y < win.z - 3.) col = mix(vec3(.62,.64,.40), vec3(.80,.65,.40), fbm(vec2(q.x*.012, q.y*.08))) * (.8 + .25*hor);
      else col = wood*1.15;
      edge += ring(q.y - win.z, 1.5)*.8 + ring(q.y - win.w, 1.5)*.6;
    }
    edge += ring(q.x - win.x, 1.5)*step(q.y, win.w) + ring(q.x - win.y, 1.5)*step(q.y, win.w);
    order = .05 + (fbm(q*.006) - .5)*.2;
  } else {
    // the seats either side and the dark under the table
    col = q.y > tbl.y ? seat*.75 : wallB*.8;
    if(seats > .5){
      float side = min(q.x, R.x - q.x);
      float sdS = sdBox(vec2(side, q.y) - vec2((Lx - 16.)*.5, tbl.x + 520.), vec2((Lx - 16.)*.5, 420.), 60.);
      float sm = 1. - smoothstep(0., 2., sdS);
      col = mix(col, seat*(.8 + .35*smoothstep(tbl.x + 100., tbl.x + 500., q.y)), sm);
      edge += ring(sdS, 1.8)*.6;
    }
    order = .7 + (fbm(q*.005) - .5)*.2;
  }
  // paint it
  vec2 uv = px / R;
  float wet = clamp((reveal*1.3 - order) / .16, 0., 1.);
  float front = wet*(1. - wet)*4.;
  vec3 A = 1. - col;
  A *= .86 + .3*fbm(uv*vec2(3.5, 2.5)*vec2(R.x/R.y, 1.) + 11.);
  A *= 1. + (noise(px*.55) - .5)*.22*smoothstep(.1, .6, dot(A, vec3(.333)));
  A *= 1. + edge*.4;
  A *= mix(.25, 1., wet) * (1. + front*.9) * step(.001, wet + front);
  vec3 paper = vec3(.94, .93, .90) * (.965 + .06*fbm(px*.07));
  gl_FragColor = vec4(paper*(1. - clamp(A, 0., 1.)), 1.);
}`;
const LIGHT = {dawn:['#FFC58A', .5, 150], day:['#FFF1CC', .42, 50], dusk:['#FF9F86', .46, -150], night:['#9FB2E8', .22, 0]};
const table = (() => {
  const esc = document.getElementById('escena'), cv = document.getElementById('lienzo');
  const gl = cv.getContext('webgl', {preserveDrawingBuffer:true, antialias:false, powerPreference:'low-power'});
  let prog = null, raf = 0, minute = 600, started = false, G = null;
  if(gl){
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
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
  function geometry(){
    const W = esc.clientWidth, H = esc.clientHeight, mobile = W < 701, rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const strip = (mobile ? 3 : 4) * rem, left = esc.querySelector('.mesa').offsetLeft;
    const far = mobile ? 6 : Math.max(1.5 * rem, left - 2.5 * rem), near = mobile ? 0 : Math.max(.5 * rem, left - 4.75 * rem);
    const winW = mobile ? W - 60 : Math.min(42.5 * rem, W * .47);
    return {W, H, mobile, rem, strip, tbl:[strip, mobile ? H + 400 : H - 2.6 * rem, far, near], win:[(W - winW) / 2, (W + winW) / 2, strip * .42, strip * .8],
            lip: mobile ? 0 : 1.1 * rem, seats: mobile ? 0 : 1, brk:[W * .23, W * .77]};
  }
  const box = el => ({x: el.offsetLeft + esc.querySelector('.mesa').offsetLeft, y: el.offsetTop + esc.querySelector('.mesa').offsetTop, w: el.offsetWidth, h: el.offsetHeight});
  const put = (id, x, y, r = 0) => { const el = document.getElementById(id); el.style.left = x.toFixed(0) + 'px'; el.style.top = y.toFixed(0) + 'px'; el.firstElementChild.style.transform = `rotate(${r}deg)`; return el; };
  function layout(){
    G = geometry();
    const {W, H, mobile, strip, rem} = G, [wl, wr] = G.win, name = daylight(minute).name, [col, alpha, skew0] = LIGHT[name];
    const skew = skew0 * (mobile ? .3 : rem / 16), reach = mobile ? Math.min(H, 29 * rem) : strip + (H - strip) * .62;
    const pts = [[wl + 2.5 * rem, strip], [wr - 2.5 * rem, strip], [wr + 10 * rem + skew, reach], [wl - 8.75 * rem + skew, reach]];
    for(const id of ['luz', 'huellas']) document.getElementById(id).setAttribute('viewBox', `0 0 ${W} ${H}`);
    const haz = document.getElementById('haz'); haz.setAttribute('points', pts.map(p => p.join(',')).join(' ')); haz.setAttribute('fill', col);
    const bar = document.getElementById('travesano'); bar.setAttribute('y', strip + (reach - strip) * .34); bar.setAttribute('height', mobile ? 7 : 16);
    document.getElementById('luz').style.opacity = alpha;
    const sh = document.getElementById('sombras');
    sh.style.clipPath = `polygon(${pts.map(p => `${p[0]}px ${p[1]}px`).join(',')})`; sh.classList.toggle('bcn', state.dir === 'bcn');
    // travel things, next to the papers they share the table with
    const intro = box(esc.querySelector('.intro')), introP = box(esc.querySelector('.intro p')), fol = box(document.getElementById('folleto')), cua = box(document.getElementById('cuaderno')), rev = box(document.getElementById('reverso'));
    const mesaR = esc.querySelector('.mesa').offsetLeft + esc.querySelector('.mesa').offsetWidth;
    const cupW = document.getElementById('cafe').firstElementChild.clientWidth || 7 * rem, penW = 11.9 * rem, tixW = 9.4 * rem;
    const oneColumn = getComputedStyle(esc.querySelector('.mesa')).gridTemplateColumns.trim().split(/\s+/).length === 1;
    if(oneColumn){
      // stacked papers: things go in the gaps, never over the text
      if(mobile) put('cafe', mesaR - cupW, introP.y + .2 * rem); else put('cafe', mesaR - cupW - .6 * rem, intro.y - .4 * rem);
      put('boli', fol.x + .5 * rem, fol.y + fol.h + .45 * rem, -4);
      put('rodalies', rev.x + rev.w - tixW - .6 * rem, rev.y - 1.9 * rem, 7);
      document.getElementById('gafas').hidden = true;
    } else {
      put('cafe', mesaR - cupW - .6 * rem, intro.y - .4 * rem); put('boli', cua.x + cua.w - 1.75 * penW, cua.y - 2.75 * rem, -7);
      put('rodalies', fol.x + 3.75 * rem, fol.y + fol.h - 1.1 * rem, 8);
      const g = document.getElementById('gafas'); g.hidden = rev.x + rev.w + 12.5 * rem > W - G.tbl[3]; put('gafas', rev.x + rev.w + 1.4 * rem, rev.y + 1.5 * rem, -9);
    }
    const cafe = document.getElementById('cafe');
    const c1 = document.getElementById('cerco1'), c2 = document.getElementById('cerco2');
    c1.setAttribute('cx', cafe.offsetLeft - 1.25 * rem); c1.setAttribute('cy', cafe.offsetTop + 9.4 * rem); c1.setAttribute('r', 2.9 * rem);
    c2.setAttribute('cx', W * .44); c2.setAttribute('cy', H - (mobile ? 180 : 6.9 * rem)); c2.setAttribute('r', 2.1 * rem);
    const peg = document.getElementById('pegatina'); peg.setAttribute('transform', `translate(${Math.min(W - 24, wr + 3.75 * rem)} ${strip * .45}) scale(${rem / 16})`);
    [['arana1', .43, .78, 140, -16], ['arana2', .62, .3, 110, 12], ['arana3', .2, .3, 90, -14]].forEach(([id, x, y, l, d]) =>
      document.getElementById(id).setAttribute('d', `M${W * x} ${H * y} l${(mobile ? l * .6 : l) * rem / 16} ${d}`));
  }
  function draw(reveal){
    const u = n => gl.getUniformLocation(prog, n), p = daylight(minute), k = cv.width / G.W;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(u('res'), cv.width, cv.height); gl.uniform1f(u('k'), k); gl.uniform1f(u('reveal'), reveal);
    gl.uniform4f(u('tbl'), ...G.tbl); gl.uniform4f(u('win'), ...G.win); gl.uniform1f(u('lip'), G.lip); gl.uniform1f(u('seats'), G.seats); gl.uniform2f(u('brk'), ...G.brk);
    for(const n of ['wallA', 'wallB', 'wood', 'seat']) gl.uniform3f(u(n), ...p[n]);
    gl.uniform3f(u('hor'), ...p.hor);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function paint(animate){
    layout();
    if(!prog) return;
    const k = Math.min(1, Math.sqrt(1.3e6 / (G.W * G.H)));
    cv.width = Math.max(2, Math.round(G.W * k)); cv.height = Math.max(2, Math.round(G.H * k));
    cancelAnimationFrame(raf);
    if(!animate){ draw(1); cv.dataset.pintada = '1'; return; }
    const t0 = performance.now();
    const step = t => { const r = Math.min(1, (t - t0) / 3400); draw(r); if(r < 1) raf = requestAnimationFrame(step); else cv.dataset.pintada = '1'; };
    raf = requestAnimationFrame(step);
  }
  // paint it the first time the table comes into view; afterwards only repaint (instantly) on resize or a new hour
  new IntersectionObserver(([e]) => {
    esc.classList.toggle('dormida', !e.isIntersecting);
    if(e.isIntersecting && !started){ started = true; paint(!reduce); }
  }).observe(esc);
  let rs = 0;
  addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => { if(started) paint(false); }, 200); });
  return {setTime(m){ const before = daylight(minute).name; minute = m; if(started && daylight(m).name !== before) paint(false); else if(started) layout(); }};
})();

const PAINT = 4.6, SPEED = 22;
const state = {dir:'reus', useNow:true, minute:null};
let t0 = performance.now(), lastT = t0, rafId = 0, acc = 0, v = 0, playing = !reduce;
const stage = document.getElementById('stage');
function repaint(){
  t0 = performance.now(); v = 0; stage.classList.remove('in');
  if(reduce || !world){ stage.classList.add('in'); if(world) world.frame(0,0,1); return; }
  playing = true; kick();
}
function loop(t){
  const dt = Math.min(.05, (t-lastT)/1000); lastT = t;
  const el = (t - t0)/1000, reveal = Math.min(1, el/PAINT);
  if(el > PAINT*.75) stage.classList.add('in');
  const target = el > PAINT ? SPEED * (state.dir==='bcn' ? -1 : 1) : 0;
  v += (target - v) * Math.min(1, dt*.45);
  acc += dt;
  if(acc >= 1/30){ world.frame(v*acc, Math.floor(el*8)/8, reveal); acc = 0; }
  if(playing && !document.hidden && !offstage) rafId = requestAnimationFrame(loop); else rafId = 0;
}
let offstage = false;
addEventListener('scroll', ()=>{ const off = scrollY >= innerHeight - 1; if(off !== offstage){ offstage = off; if(!off && playing) kick(); } }, {passive:true});
function kick(){ if(!rafId && world){ lastT = performance.now(); rafId = requestAnimationFrame(loop); } }
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && playing) kick(); });
addEventListener('resize', ()=>{ if(!playing && world) world.frame(0,0,1); });
addEventListener('keydown', e=>{
  if(e.target.closest && e.target.closest('input,button')) return;
  if(e.key==='r' || e.key==='R') repaint();
  if(e.key==='p' || e.key==='P'){ playing=!playing; if(playing) kick(); }   // space is left to scroll the page
});

// days missing from the data borrow the latest known day of the same kind (weekday, Saturday or Sunday)
function dayData(iso){
  if(DATA[iso]) return {d:DATA[iso], exact:true};
  const kind = x => { const w = weekday(x); return w===6 ? 6 : w===0 ? 0 : 1; };
  const ref = Object.keys(DATA).sort().reverse().find(x => kind(x)===kind(iso));
  return {d:DATA[ref], exact:false};
}
const tIn = document.getElementById('t'), tOut = document.getElementById('tOut'), nowBtn = document.getElementById('nowBtn');
const R0 = 300, R1 = 1439, pos = m => ((Math.min(R1,Math.max(R0,m))-R0)/(R1-R0)*100).toFixed(2)+'%';
document.getElementById('hours').innerHTML = [6,9,12,15,18,21].map(x=>`<span style="left:${pos(x*60)}">${x} h</span>`).join('');
let todayTrains = [], shown = null;
function render(){
  const now = madridNow();
  const start = state.useNow ? now.min : state.minute;
  const key = state.dir==='reus' ? 'r' : 'b';
  const from = state.dir==='reus' ? 'Sants' : 'Reus', to = state.dir==='reus' ? 'Reus' : 'Barcelona Sants';
  let iso = now.date, {d, exact} = dayData(iso);
  todayTrains = d[key];
  let list = d[key].filter(([dep]) => dep >= start + (state.useNow?2:0)).slice(0,3), tomorrow = false;
  if(!list.length){ iso = addDays(now.date,1); ({d, exact} = dayData(iso)); list = d[key].slice(0,3); tomorrow = true; }
  const [a, ...rest] = list;
  const live = state.useNow && !tomorrow;
  document.getElementById('lbl').textContent = state.useNow || tomorrow ? 'Próximo tren' : 'Tren elegido';
  // the ruler: every tick is a train, the chosen one stands taller
  document.getElementById('ticks').innerHTML = todayTrains.map(([dep])=>`<i class="${!tomorrow && dep===a[0]?'on':''}" style="left:${pos(dep)}"></i>`).join('');
  tIn.value = state.useNow ? Math.min(R1, Math.max(R0, now.min)) : start;
  document.getElementById('tLbl').textContent = state.useNow ? 'Son las' : 'Tren de las';
  tOut.textContent = hhmm(state.useNow ? now.min : a[0]);
  tIn.setAttribute('aria-valuetext', tomorrow ? 'no quedan trenes hoy' : `tren de las ${hhmm(a[0])}`);
  nowBtn.hidden = state.useNow;
  if(world) world.setTime(tomorrow ? a[0] : start);
  table.setTime(tomorrow ? a[0] : start);
  document.getElementById('soon').innerHTML = tomorrow ? 'Hoy ya no quedan trenes. El primero de mañana' :
    live ? `Sale de ${from} en <strong>${dur(a[0]-now.min)}</strong>` : `Sale de ${from}`;
  const dep = document.getElementById('dep');
  if(shown !== a[0] + state.dir){ dep.textContent = hhmm(a[0]); if(shown !== null){ dep.classList.remove('swap'); void dep.offsetWidth; dep.classList.add('swap'); } shown = a[0] + state.dir; }
  drawTickets(from, to, a);
  document.getElementById('then').innerHTML = rest.length ? `Luego ${rest.map(r=>`<button type="button" class="tt" data-m="${r[0]}" aria-label="Ver el tren de las ${hhmm(r[0])}">${hhmm(r[0])}</button>`).join(' y ')}` : '';
  const prev = !tomorrow && !live ? [...todayTrains].reverse().find(([x]) => x < a[0]) : null;
  document.getElementById('prev').innerHTML = prev ? `Anterior <button type="button" class="tt" data-m="${prev[0]}" aria-label="Ver el tren anterior, de las ${hhmm(prev[0])}">${hhmm(prev[0])}</button>` : '';
  document.getElementById('note').textContent = exact ? '' : 'Horario aproximado: aún no tengo el oficial de este día.';
  if(world && (!playing || reduce)) world.frame(0,0,1);
}
function pick(m){ state.useNow = false; state.minute = m; render(); }
nowBtn.addEventListener('click', ()=>{ state.useNow = true; render(); tIn.focus({preventScroll:true}); });
document.getElementById('info').addEventListener('click', e=>{ const b = e.target.closest('.tt'); if(b) pick(+b.dataset.m); });
// dragging or tapping the ruler lands on the nearest train, never between two
let rq = 0;
function snap(){
  const v = +tIn.value; if(!todayTrains.length) return;
  const near = todayTrains.reduce((b,[x]) => Math.abs(x-v) < Math.abs(b-v) ? x : b, todayTrains[0][0]);
  state.useNow = false; state.minute = near;
  if(!rq) rq = requestAnimationFrame(()=>{ rq=0; render(); });
}
tIn.addEventListener('input', snap); tIn.addEventListener('change', snap); tIn.addEventListener('pointerup', ()=> setTimeout(snap, 0));
// keys step from train to train
tIn.addEventListener('keydown', e=>{
  const cur = +document.getElementById('dep').textContent.slice(0,2)*60 + +document.getElementById('dep').textContent.slice(3,5);
  const deps = todayTrains.map(([x])=>x); let m = null;
  if(e.key==='ArrowRight' || e.key==='ArrowUp') m = deps.find(x => x > cur);
  else if(e.key==='ArrowLeft' || e.key==='ArrowDown') m = [...deps].reverse().find(x => x < cur);
  else if(e.key==='Home') m = deps[0];
  else if(e.key==='End') m = deps[deps.length-1];
  else return;
  e.preventDefault(); if(m != null) pick(m);
});
// a ragged scissor cut, different for every ticket, with the two punch notches of the stub
function cut(seed, notchFromRight){
  let s = seed; const r = ()=> (s = (s*9301+49297)%233280)/233280;
  const pts = [], n = 16, j = ()=> (r()*2.4).toFixed(2);
  for(let i=0;i<=n;i++) pts.push(`${(i/n*100).toFixed(2)}% ${j()}%`);
  for(let i=1;i<=4;i++){ const y = i*20; pts.push(`calc(100% - ${j()}%) ${y}%`); }
  for(let i=n;i>=0;i--) pts.push(`${(i/n*100).toFixed(2)}% calc(100% - ${j()}%)`);
  for(let i=4;i>=1;i--){ const y = i*20; pts.push(`${j()}% ${y}%`); }
  return `polygon(${pts.join(',')})`;
}
function drawTickets(from, to, a){
  const other = state.dir==='reus' ? {d:'bcn', route:'Reus → Sants', title:'A Barcelona'} : {d:'reus', route:'Sants → Reus', title:'A Reus'};
  const mins = a[1]-a[0];
  document.getElementById('tickets').innerHTML = `
    <button type="button" class="tk on" aria-pressed="true" style="--cut:${cut(7)}">
      <span class="pp"><span class="k">Billete sencillo, tren directo</span>
      <span class="route">${from} → ${to==='Barcelona Sants'?'Sants':to}</span>
      <span class="row">Llega a las <b>${hhmm(a[1])}</b> · ${dur(mins)}</span></span><span class="stub" aria-hidden="true"></span>
    </button>
    <button type="button" class="tk off" data-d="${other.d}" aria-pressed="false" style="--cut:${cut(23)}" aria-label="Cambiar a ${other.title}">
      <span class="pp"><span class="k">${other.route}</span><span class="route">${other.title}</span></span><span class="stub" aria-hidden="true"></span>
    </button>`;
}
document.getElementById('tickets').addEventListener('click', e=>{
  const b = e.target.closest('.tk.off'); if(!b) return;
  state.dir = b.dataset.d; render();
  requestAnimationFrame(()=> document.querySelector('.tk.off')?.focus({preventScroll:true}));
  if(world) world.resize();
});
setInterval(()=>{ if(state.useNow) render(); }, 30000);
{ const last = Object.keys(DATA).sort().pop();
  document.getElementById('hasta').textContent = `Horarios cargados hasta el ${new Date(last+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}; los días siguientes se aproximan.`; }
render();
document.fonts && document.fonts.ready.then(()=> world && world.resize());
repaint();

// scrolling down, the gaze drops from the window to the table: the wall tilts away, the table rises and lands,
// the papers fall onto it and the notebook opens. Follows the finger both ways.
function setupShelf(){
  gsap.registerPlugin(ScrollTrigger);
  const PINNED = '(min-width:1000px) and (min-height:780px) and (min-aspect-ratio:1/1)';
  gsap.matchMedia().add({motion:'(prefers-reduced-motion: no-preference)', wide:'(min-width:701px)', pinned:PINNED}, ctx => {
    if(!ctx.conditions.motion) return;
    const {pinned} = ctx.conditions, shelf = document.getElementById('repisa');
    // the hinge reads the scroll directly: it must match the table's real position on every frame
    const onScroll = () => pitch();
    addEventListener('scroll', onScroll, {passive:true}); addEventListener('resize', onScroll);
    pitch();
    // each paper with the tilt it rests at (the same as in the stylesheet)
    const papers = [['#folleto', -2.5], ['#cuaderno', 1], ['#reverso', -1.2]].map(([s, r]) => [document.querySelector(s), r]);
    const leaf = document.querySelector('.cuaderno .izq');
    if(pinned){
      // layout offsets, not the trigger's box: the shelf is tilted by pitch() while it is measured
      const tl = gsap.timeline({scrollTrigger:{start:() => shelf.offsetTop, end:() => shelf.offsetTop + shelf.offsetHeight - innerHeight, scrub:.6, invalidateOnRefresh:true}});
      // each paper starts falling before the previous one lands; the cover opens as the last one settles
      papers.forEach(([el, rot], i) => tl.add(land(el, rot, 35), i * .35));
      tl.add(openLeaf(leaf, 'Y', 1), 1.55);
    } else {
      // stacked papers: each one lands as it scrolls in (layout offsets again: the table may still be tilted)
      const between = (el, a, b) => ({start:() => pageTop(el) - innerHeight * a, end:() => pageTop(el) - innerHeight * b, scrub:.6, invalidateOnRefresh:true});
      papers.forEach(([el, rot]) => gsap.timeline({scrollTrigger:between(el, 1, .65)}).add(land(el, rot, 10)));
      // the leaf turns sideways when the pages sit side by side, and folds down when they are stacked
      const side = getComputedStyle(document.querySelector('.cuaderno')).gridTemplateColumns.trim().split(/\s+/).length > 1;
      gsap.timeline({scrollTrigger:between(papers[1][0], .55, .2)}).add(side ? openLeaf(leaf, 'Y', 1) : openLeaf(leaf, 'X', -1));
    }
    return () => {
      removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); pitch(true);
      [...papers.map(([el]) => el), leaf].forEach(rest);
    };
  });
}

const inOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = x => Math.min(1, Math.max(0, x));
// where an element sits on the page, ignoring any transform on the way
const pageTop = el => { let y = 0; for(let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
const rest = el => ['transform', 'opacity', 'visibility', '--alto'].forEach(p => el.style.removeProperty(p));

// a paper falls with weight: it speeds up and flutters on the way down, its shadow says how high it still is (--alto),
// then it settles with a small overshoot. Drawn straight onto the element so the scrub can run it both ways.
function land(el, rot, drop){
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
function openLeaf(leaf, axis, sign){
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
const dropped = () => clamp01(scrollY / innerHeight);
const hingeAt = p => innerHeight * (1 - p);
function pitch(reset){
  const hero = document.getElementById('hero'), shelf = document.getElementById('repisa');
  const vh = innerHeight, P = 2 * vh, p = reset === true ? 0 : dropped();
  const fold = hingeAt(p);
  const wall = PITCH_WALL * inOut(clamp01(p / .85));
  const bump = p > .9 ? 1.4 * Math.sin(Math.PI * (p - .9) / .1) : 0;
  const table = PITCH_TABLE * Math.pow(1 - inOut(clamp01((p - .1) / .8)), 1.2) + bump;
  // scale so the wall's top edge, projected from the hinge, stays outside the frame; sized as if the hinge sat
  // 15% of a screen lower, a spare margin for a frame where the scroll and the fixed wall do not quite agree
  const tw = wall * Math.PI / 180, reach = fold + .15 * vh;
  const s = Math.max(1, P / (P * Math.cos(tw) - reach * Math.sin(tw)));
  hero.style.transformOrigin = `50% ${fold.toFixed(1)}px`;
  hero.style.transform = p > 0 && p < 1 ? `perspective(${P}px) rotateX(${wall.toFixed(3)}deg) scale(${s.toFixed(4)})` : '';
  hero.style.visibility = p >= 1 ? 'hidden' : '';
  shelf.style.transformOrigin = '50% 0';
  shelf.style.transform = p > 0 && table > .001 ? `perspective(${P}px) rotateX(${table.toFixed(3)}deg)` : '';
  // the wall darkens as it turns away from the window's light: a pigment wash painted in the wall's own
  // shader, climbing from the hinge (in the wall's own coordinates the hinge sits at uv.y = p), and the
  // texts on it dim with it (--lavado). With no WebGL, `world` is null and the flat #sombra veil is the fallback
  const shade = Math.pow(wall / PITCH_WALL, 1.3);
  if(shade > 0) hero.style.setProperty('--lavado', shade.toFixed(3)); else hero.style.removeProperty('--lavado');
  if(world) world.setWash(p, shade);
  else document.getElementById('sombra').style.opacity = (.6 * shade).toFixed(3);
  document.getElementById('more').style.opacity = Math.max(0, 1 - p * 8).toFixed(3);
}
setupShelf();

// what check.py reads from the page (modules keep everything else private)
window.reus = { hingeAt, dropped, ScrollTrigger };
