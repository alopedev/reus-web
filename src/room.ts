// The carriage built in 3D (Àlex, 07-11: a Rodalies regional of today), lit by the window's light, then painted with
// brush strokes (shaders/room.frag) that the watercolour pass (watercolor.frag) lays like the rest of the wall.
// Where the seats, the camera and the lamp go: carriage.ts. Rendered only when the screen, the window or the light
// change, never per frame: the watercolour pass reads the three targets below as they were left
import { AmbientLight, BoxGeometry, Color, CylinderGeometry, DirectionalLight, DoubleSide, ExtrudeGeometry, Group, LinearFilter, Mesh, MeshLambertMaterial, MeshNormalMaterial, NearestFilter, Object3D, OrthographicCamera, PCFShadowMap, PerspectiveCamera, PlaneGeometry, PointLight, RGBAFormat, Scene, ShaderMaterial, ShapeGeometry, TorusGeometry, Vector2, Vector4, WebGLRenderTarget, type BufferGeometry, type WebGLRenderer } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ARMREST, plan, type Win } from './carriage';
import { ring, wallShape } from './wall';
import roomFrag from './shaders/room.frag?raw';

const LUX = Math.PI;   // lights as in r128 (see world.ts)

export interface Light { sun: number[]; hor: number[]; wallA: number[] }
export interface Room {
  raw: WebGLRenderTarget;      // the carriage as rendered: its alpha, where there is something in front of the wall
  painted: WebGLRenderTarget;  // painted with brush strokes: the colour, and in alpha its edges
  paper: WebGLRenderTarget;    // the paper's tooth and washes, as a factor on the paint (r, less a half)
  layout(A: number, win: Win, r: number, wide: boolean): void;
  light(p: Light, night: number): void;
  render(W: number, H: number): void;
  compile(): void;
  coverage(): { over: number; gaps: number };   // check.py: how much of the window a seat covers, and of the wall is missing
}

export function createRoom(renderer: WebGLRenderer): Room {
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFShadowMap;   // three r186 turns PCFSoft into this at the first shadow, after compile(): a second link of every program
  const target = () => new WebGLRenderTarget(2, 2, {format:RGBAFormat, minFilter:LinearFilter, magFilter:LinearFilter});
  const raw = target(), normal = target(), painted = target(), paper = target();
  painted.texture.minFilter = painted.texture.magFilter = NearestFilter;   // its strokes as sharp as painted
  const normals = new MeshNormalMaterial();   // each surface's facing: which way the brush runs over it
  const scene = new Scene();
  const cam = new PerspectiveCamera(30, 1, .05, 50);
  let group = new Group(); scene.add(group);
  let sunK = 1, sunBase = LUX, lampK = 0, lampBase = 0;
  const amb = new AmbientLight(0xffffff, .3*LUX); scene.add(amb);
  const sun = new DirectionalLight(0xffffff, LUX); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -.0004;
  scene.add(sun); scene.add(sun.target);
  const glow = new PointLight(0xffffff, .5*LUX, 0, 1.2); scene.add(glow);   // the sky's light through the glass
  const lamp = new PointLight(0xfff1d8, 0, 0, 2); scene.add(lamp);          // a phone at night: the strip light over our seat
  const ceil = new DirectionalLight(0xffffff, .4*LUX); scene.add(ceil); scene.add(ceil.target);   // the ceiling's strip lights
  const M = (c: number, opacity?: number) => new MeshLambertMaterial({ color: c, transparent: opacity !== undefined, opacity: opacity ?? 1 });
  const mats = {
    wall: M(0xb8b6b0), wallLow: M(0x8e8c88), lining: M(0xd2d0cb), rubber: M(0x1a1a1c),
    seat: M(0x3a4552), cushionShade: M(0x252c35), head: M(0x56606c), shell: M(0x8f9194), base: M(0x2a2a2c),
    alu: M(0xc9cdd1), glass: M(0xcfe0e6, .35), case: M(0x4f6478), pack: M(0xa8492c),
    dark: M(0x1c1c1e), mapW: M(0xeeece6), line: M(0x8a6a4a),
  };
  mats.wall.side = DoubleSide;
  const add = (geo: BufferGeometry, mat: MeshLambertMaterial, x: number, y: number, z: number, parent: Object3D = group, cast = true) => {
    const m = new Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  };
  // the two painting passes, each a full-screen quad of room.frag
  const quad = (defines: Record<string, string>) => {
    const mat = new ShaderMaterial({ defines, uniforms: U, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`, fragmentShader: roomFrag });
    const s = new Scene(); s.add(new Mesh(new PlaneGeometry(2, 2), mat)); return s;
  };
  const U = { tRoom:{value:raw.texture}, tRoomN:{value:normal.texture}, sres:{value:new Vector2(2, 2)}, aspect:{value:1}, win:{value:new Vector4(0, 0, 1, 1)} };
  const brushScene = quad({}), paperScene = quad({PAPER_PASS: ''}), flat = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  function layout(A: number, win: Win, r: number, wide: boolean){
    scene.remove(group); group.traverse(o => { if(o instanceof Mesh) o.geometry.dispose(); });
    group = new Group(); scene.add(group);
    U.win.value.set(win.x, win.y, win.z, win.w); U.aspect.value = A; box = win; boxA = A; boxR = r;
    const P = plan(A, win, wide), { m, floorY, cx } = P, rf = P.rack ?? 0;
    sunK = wide ? 1 : .5;                                // on a phone the lit cushion sits under the texts
    // the wall, with the window's opening; under the sill a darker panel
    add(new ShapeGeometry(wallShape(A, win, r), 24), mats.wall, 0, 0, 0);
    add(new BoxGeometry(A + 4, (win.y - .035) + 2, .01), mats.wallLow, A/2, (win.y - .035 - 2)/2, .004).castShadow = false;
    // the lining round the window: a black rubber seal at the glass, a moulded grey frame standing off the wall
    add(new ExtrudeGeometry(ring(win, A, r, 0, .006), {depth: .012, bevelEnabled: false, curveSegments: 16}), mats.rubber, 0, 0, 0);
    add(new ExtrudeGeometry(ring(win, A, r, .006, .034), {depth: .018, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 3, curveSegments: 16}), mats.lining, 0, 0, 0);
    add(new RoundedBoxGeometry((win.z - win.x)*A + .08, .014, .07, 2, .005), mats.lining, cx, win.y - .04, .035);   // the sill
    // the line's map over the window: a white strip, the line, a dot per station
    const mw = (win.z - win.x)*A*.78;
    add(new BoxGeometry(mw*2, .024, .003), mats.mapW, cx, win.w + .052, .002, group, false);
    add(new BoxGeometry(mw*2 - .02, .0035, .004), mats.line, cx, win.w + .052, .003, group, false);
    for(let i = 0; i <= 11; i++) add(new CylinderGeometry(.004, .004, .005, 12).rotateX(Math.PI/2), mats.dark, cx - mw + .01 + i*(mw*2 - .02)/11, win.w + .052, .004, group, false);
    // the rack: a glass shelf on aluminium brackets, a round front rail, a rail along the wall
    const depth = .36*m;
    if(P.rack !== null){
      add(new BoxGeometry(A + 4, .004, depth), mats.glass, A/2, rf, depth/2, group, false);
      add(new CylinderGeometry(.009, .009, A + 4, 16).rotateZ(Math.PI/2), mats.alu, A/2, rf, depth);
      add(new CylinderGeometry(.005, .005, A + 4, 12).rotateZ(Math.PI/2), mats.alu, A/2, rf + .004, .006);
      for(const s of [-1, 0, 1]){
        const bx = cx + s*(s === 0 ? 0 : .965)*m;
        if(bx > win.x*A - .02 && bx < win.z*A + .02) continue;   // on the wall between windows: never hanging over the glass
        add(new BoxGeometry(.006, .012, depth), mats.alu, bx, rf - .006, depth/2);
        add(new BoxGeometry(.006, .01, depth*1.1), mats.alu, bx, rf - .035, depth*.45).rotation.x = Math.atan2(.06, depth);
        add(new BoxGeometry(.02, .05, .006), mats.alu, bx, rf - .05, .003);
    }
    }
    // luggage: a cabin case lying on its side, a backpack
    if(P.luggage){
      add(new RoundedBoxGeometry(.42*m, .17*m, .28*m, 4, .03*m), mats.case, P.bags, rf + .002 + .085*m, .17*m).rotation.y = .06;
      for(const dy of [-.04, 0, .04]) add(new BoxGeometry(.4*m, .003, .004), mats.dark, P.bags, rf + .085*m + dy*m, .17*m + .14*m + .001, group, false);
      add(new TorusGeometry(.03*m, .006*m, 8, 16, Math.PI), mats.dark, P.bags, rf + .17*m, .17*m);
      for(const dz of [-.12, .12]) add(new CylinderGeometry(.022*m, .022*m, .02*m, 16).rotateZ(Math.PI/2), mats.dark, .215*m + P.bags, rf + .026*m, .17*m + dz*m);
      add(new RoundedBoxGeometry(.3*m, .13*m, .24*m, 5, .055*m), mats.pack, P.bags + .125*A, rf + .002 + .065*m, .15*m).rotation.y = -.12;
      add(new RoundedBoxGeometry(.2*m, .07*m, .03*m, 4, .015*m), mats.pack, P.bags + .125*A, rf + .045*m, .15*m + .125*m);
      add(new BoxGeometry(.03*m, .14*m, .01*m), mats.dark, .06*m + P.bags + .125*A, rf - .03*m, depth + .012).rotation.z = .1;
    }
    // the seats, in profile: cushion, a reclined backrest with its plastic shell, headrest, frame, the aisle armrest
    for(const s of P.seats){
      const g = new Group(); g.position.set(s.x, s.y0, 0); g.scale.set(s.dir*s.scale, s.scale, s.scale); group.add(g);
      const w = .48, z0 = .05;
      const at = (geo: BufferGeometry, mat: MeshLambertMaterial, u: number, v: number, rot = 0) => { const k = add(geo, mat, u, v, z0 + w/2, g); k.rotation.z = rot; return k; };
      // on a phone our cushion sits behind the day's ruler: in shade, so its hours read (Àlex, 08-11)
      at(new RoundedBoxGeometry(.54, .13, w, 4, .05), wide ? mats.seat : mats.cushionShade, .31, .45);
      at(new RoundedBoxGeometry(.13, .74, w, 4, .05), mats.seat, .03, .82, .09);
      at(new RoundedBoxGeometry(.04, .78, w + .01, 2, .015), mats.shell, -.035, .80, .09);
      at(new RoundedBoxGeometry(.17, .22, w - .04, 4, .07), mats.head, -.02, 1.17, .09);
      at(new BoxGeometry(.3, .22, w*.7), mats.base, .2, .27);
      at(new RoundedBoxGeometry(.3, .07, .07, 4, .03), mats.head, .17, ARMREST).position.z = z0 + w - .02;
      if(s.handle) at(new TorusGeometry(.055, .012, 8, 20, Math.PI), mats.alu, -.07, 1.29, .09).position.z = z0 + w - .03;
    }
    if(P.lamp){ lamp.position.set(P.lamp[0], P.lamp[1], P.lamp[2]); lamp.distance = P.lamp[3]; lampK = 1; } else lampK = 0;
    // the camera in front of the wall, an off-axis frustum so that the wall at z = 0 fills the screen exactly
    const [ex, ey, ed] = P.eye, n = .05;
    cam.position.set(ex, ey, ed); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld();
    cam.projectionMatrix.makePerspective((0 - ex)*n/ed, (A - ex)*n/ed, (1 - ey)*n/ed, (0 - ey)*n/ed, n, 50);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    // the sun, from outside, through the window, down onto the seats and the aisle
    sun.position.set(cx - .35, win.w + .9, -1.4); sun.target.position.set(cx + .1, floorY + .3*m, .9);
    const sc = sun.shadow.camera; sc.left = -2; sc.right = 2; sc.top = 2; sc.bottom = -2; sc.near = .1; sc.far = 6; sc.updateProjectionMatrix();
    glow.position.set(cx, (win.y + win.w)/2, -.05);
    ceil.position.set(A/2, 3, 3); ceil.target.position.set(A/2, 0, 0);
  }
  // the light of the hour (daylight in light.ts): the sun and the sky through the window, the ceiling's LEDs; at night
  // the carriage lit from inside (night: 0 by day, 1 at night)
  function light(p: Light, night: number){
    const led = new Color(.95, .96, 1);
    sun.color.setRGB(p.sun[0], p.sun[1], p.sun[2]); sunBase = 1.4*(1 - night)*LUX;
    glow.color.setRGB(p.hor[0], p.hor[1], p.hor[2]); glow.intensity = (.9*(1 - night) + .1)*LUX;
    lampBase = .3*night*LUX;
    ceil.color.copy(led); ceil.intensity = (.35 + .1*night)*LUX;
    amb.color.setRGB(p.wallA[0], p.wallA[1], p.wallA[2]).lerp(led, .5); amb.intensity = (.55 - .3*night)*LUX;
  }
  function render(W: number, H: number){
    sun.intensity = sunBase*sunK; lamp.intensity = lampBase*lampK;
    for(const t of [raw, normal, painted, paper]) t.setSize(W, H);
    U.sres.value.set(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(raw); renderer.clear(); renderer.render(scene, cam);
    scene.overrideMaterial = normals;
    renderer.setClearColor(0x8080ff, 0); renderer.setRenderTarget(normal); renderer.clear(); renderer.render(scene, cam);
    scene.overrideMaterial = null; renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(painted); renderer.render(brushScene, flat);
    renderer.setRenderTarget(paper); renderer.render(paperScene, flat);
  }
  // read back once, only when check.py asks: the share of the window's box with the carriage in front of it, and of
  // the rest of the screen with nothing (a wall the triangulation lost shows as a black patch)
  let box = { x: 0, y: 0, z: 1, w: 1 }, boxA = 1, boxR = 0;
  function coverage(){
    const W = raw.width, H = raw.height, px = new Uint8Array(W*H*4);
    renderer.readRenderTargetPixels(raw, 0, 0, W, H, px);
    let inW = 0, over = 0, outW = 0, gaps = 0;
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      const a = px[(y*W + x)*4 + 3], u = (x + .5)/W, v = (y + .5)/H;
      // how far from the window's opening (its rounded corners are wall), in wall units: a pixel either side of its
      // edge is the edge's own, counted in neither
      const qx = Math.abs(u*boxA - (box.x + box.z)/2*boxA) - ((box.z - box.x)/2*boxA - boxR), qy = Math.abs(v - (box.y + box.w)/2) - ((box.w - box.y)/2 - boxR);
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - boxR;
      if(sd < -2/H){ inW++; if(a > 242) over++; } else if(sd > 2/H){ outW++; if(a < 250) gaps++; }
    }
    return { over: over/Math.max(1, inW), gaps: gaps/Math.max(1, outW) };
  }
  // every program linked before the landscape's first frame: compile() leaves out the shadows' depth material, so the
  // carriage is also rendered once, at the size it has (check_shaders_ready)
  function compile(){
    renderer.compile(scene, cam);
    // compile() reads each mesh's own material, never the scene's override: the facings' material is lent to one
    const any = group.children.find(o => o instanceof Mesh) as Mesh | undefined;
    if(any){ const own = any.material; any.material = normals; renderer.compile(scene, cam); any.material = own; }
    for(const s of [brushScene, paperScene]) renderer.compile(s, flat);
    render(raw.width, raw.height); renderer.setRenderTarget(null);   // and the shadows' depth material, before any draw
  }
  return { raw, painted, paper, layout, light, render, compile, coverage };
}
