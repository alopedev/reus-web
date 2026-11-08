precision highp float;
uniform sampler2D tScene; uniform vec2 res, sres; uniform float tq, reveal, aspect, waspect, hor, wrad, foldY, shade;
uniform vec3 skyTop, skyHor, sunCol, wood; uniform vec2 sunPos; uniform float sunA; uniform vec4 win; uniform float wx; uniform vec4 brd; uniform float washAll;
// the carriage (room.ts): as rendered (its alpha), painted (room.frag), and the paper's factor; overWin: a seat over the window
uniform sampler2D tRoom, tRoomP, tPaper; uniform float overWin;
// PROTOTYPE idea 1: the brush's direction rendered from the landscape (tDir), the option (pincel: 0 none, 1 a, 2 b, 3 c),
// how far the land has moved (flowOff, over a period flowP) and the camera's focal length in the target's pixels (fpx)
uniform sampler2D tDir; uniform float pincel, flowOff, flowP, fpx;
// PROTOTYPE idea 3: the light in the carriage (luz: 0 none, 1 a, 2 b, 3 c)
uniform float luz; uniform sampler2D tPoster; uniform float posterOn; uniform sampler2D tWipe; uniform float vaho; uniform float aliento; uniform float calido;
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
  // the weather at home (wx: 0 fair, 1 overcast, 2 rain, 3 fog): anything but fair greys the sky into bands of
  // cloud, in the light of the hour, and hides the sun
  float ov = step(.5, wx);
  vec3 grey = vec3(dot(s, vec3(.3,.5,.2)))*vec3(.92,.94,1.)*.92;
  vec3 cl = mix(grey, grey*.78, smoothstep(.45,.75,fbm(w*vec2(1.6,4.)+vec2(t*.01,0.)))*.6);
  s = mix(s, cl, ov*.85);
  return mix(s, sunCol, smoothstep(.09,.08,rr)*sunA*(1.-ov));
}
// what the window shows, before it becomes paint
float ring(float sd, float w){ return 1. - smoothstep(0., w, abs(sd)); }
// PROTOTYPE idea 1 ----------------------------------------------------------------------------------------------
// the direction of the brush at this point, in the target's pixels: rendered from the scene where there is land; in
// the sky, level bands that wander (c: curving round the sun)
vec2 brushDir(vec2 s, vec2 w, out vec4 dd){
  dd = texture2D(tDir, s);
  if(dd.a < .5){
    vec2 F = normalize(vec2(1., (fbm(w*vec2(1.5,2.5)+5.)-.5)*.6));
    if(pincel > 2.5){ vec2 d = (w - sunPos)*vec2(waspect,1.); vec2 round = normalize(vec2(-d.y, d.x)); F = normalize(mix(F, round*sign(dot(round,F)+1e-4), smoothstep(.45,.12,length(d)))); }
    return F;
  }
  float a = atan(dd.g*2.-1., dd.r*2.-1.)*.5;
  return vec2(cos(a), sin(a));
}
vec4 quadA(vec2 p, vec2 qx, vec2 qy, out float var){
  vec4 m = vec4(0.); vec3 s = vec3(0.);
  for(int j=0;j<3;j++) for(int i=0;i<3;i++){ vec4 c = texture2D(tScene, p + float(i)*qx + float(j)*qy); m += c; s += c.rgb*c.rgb; }
  m /= 9.; s /= 9.; s = abs(s - m.rgb*m.rgb); var = s.r+s.g+s.b; return m;
}
// the paint dragged along the brush (a line integral along the field): facets of the same thing at the same
// distance along the stroke melt into one wash, edges across it stay
vec4 drag(vec2 p, vec2 F0, float steps, float stepPx){
  vec2 px = 1./res; vec4 c0 = texture2D(tScene, p), acc = c0; float n = 1.;
  for(int sgn=0; sgn<2; sgn++){
    vec2 q = p, F = F0*(sgn==0 ? 1. : -1.);
    for(int i=0;i<10;i++){
      if(float(i) >= steps) break;
      q += F*px*stepPx;
      vec4 d = texture2D(tDir, q);
      vec2 Fn = d.a < .5 ? vec2(1.,0.) : vec2(cos(atan(d.g*2.-1., d.r*2.-1.)*.5), sin(atan(d.g*2.-1., d.r*2.-1.)*.5));
      F = Fn*sign(dot(Fn, F) + 1e-4);
      vec4 c = texture2D(tScene, q);
      vec4 dc = c - c0;
      float wgt = (1. - float(i)/(steps+1.)) * exp(-dot(dc, dc)*30.);   // only over the same colour: edges stay
      acc += c*wgt; n += wgt;
    }
  }
  return acc/n;
}
// the four-quadrant filter stretched along the brush (len px along it, wid across)
vec4 kuwaharaA(vec2 p, vec2 F, float len, float wid){
  vec2 px = 1./res, G = vec2(-F.y, F.x), ax = F*px*len, ay = G*px*wid;
  float v0,v1,v2,v3;
  vec4 a=quadA(p,-ax,-ay,v0), b=quadA(p,ax,-ay,v1), c=quadA(p,ax,ay,v2), d=quadA(p,-ax,ay,v3);
  vec4 r=a; float mv=v0; if(v1<mv){mv=v1;r=b;} if(v2<mv){mv=v2;r=c;} if(v3<mv){mv=v3;r=d;} return r;
}
// one layer of loose strokes over the land, on a grid that travels with it (shift: px the land has moved here)
void strokesA(vec2 q, vec2 F, vec2 G, float cs, float off, float shift, vec3 here, float tol, out vec3 col, out float cover, out float rim){
  col = here; cover = 0.; rim = 0.;
  vec2 qa = q + vec2(shift, 0.);
  vec2 cq = vec2(dot(qa, F), dot(qa, G))/cs + off;
  vec2 cell = floor(cq);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 c = cell + vec2(float(i), float(j));
    float r1 = hash(c + off*7.1), r2 = hash(c.yx + 3.3 + off), r3 = hash(c + 9.7);
    vec2 cen = c + .5 + (vec2(r1, r2) - .5)*vec2(.6, .5);
    float rr = length((cq - cen)/vec2(1.05 + .4*r3, .36 + .12*r1));
    float k = 1. - smoothstep(.55, 1., rr);
    if(k <= 0.) continue;
    vec2 cuv = ((cen.x - off)*cs*F + (cen.y - off)*cs*G - vec2(shift, 0.))/res;
    vec4 sc4 = texture2D(tScene, cuv);
    vec3 sc = sc4.a > .5 ? sc4.rgb/sc4.a : here;
    if(length(sc - here) > tol) continue;
    if(k > cover){ col = sc*(pincel > 2.5 ? .86 + .24*r2 : .92 + .13*r2); cover = k; rim = ring(rr - .85, .2); }
  }
}
// strokes in the sky (it is not in the scene): only how loaded each one was, and its rim
vec3 skyStrokes(vec2 q, vec2 F, float cs){
  vec2 G = vec2(-F.y, F.x), cq = vec2(dot(q, F), dot(q, G))/cs, cell = floor(cq);
  vec3 o = vec3(0.);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 c = cell + vec2(float(i), float(j));
    float r1 = hash(c + 4.1), r2 = hash(c.yx + 8.3), r3 = hash(c + 1.7);
    vec2 cen = c + .5 + (vec2(r1, r2) - .5)*vec2(.6, .5);
    float rr = length((cq - cen)/vec2(1.3 + .5*r3, .34 + .1*r1));
    float k = 1. - smoothstep(.55, 1., rr);
    if(k > o.x) o = vec3(k, r2, ring(rr - .85, .2));
  }
  return o;
}
// the land and sky painted along the brush: returns the filtered colour (premultiplied, alpha = land)
vec4 brushed(vec2 s, vec2 w, out vec3 strokeCol, out float strokeK, out float strokeRim){
  vec4 dd; vec2 F = brushDir(s, w, dd), G = vec2(-F.y, F.x);
  // near things get longer strokes than far ones (dd.b: sqrt(3/depth))
  float near = dd.a > .5 ? .35 + dd.b : 1.;
  vec4 k = drag(s, F, pincel > 2.5 ? 10. : 8., (pincel > 2.5 ? 2.8 : 2.4)*near*res.y/400.);
  strokeCol = vec3(0.); strokeK = 0.; strokeRim = 0.;
  if(pincel > 1.5){
    vec3 here = k.a > .02 ? k.rgb/k.a : vec3(0.);
    if(dd.a < .5) here = vec3(0.);
    // the land moves past at a speed set by its depth (dd.b = sqrt(3/z)); two grids that take turns, each fading
    // out before it jumps back, so the strokes travel with the land and never pop
    float ppu = dd.a > .5 ? dd.b*dd.b/3.*fpx : 0.;
    float cs = (pincel > 2.5 ? 22. : 14.)*res.y/400.*(.5 + (dd.a > .5 ? dd.b : .5));
    float ph0 = fract(flowOff/flowP), ph1 = fract(flowOff/flowP + .5);
    float w0 = 1. - abs(2.*ph0 - 1.), w1 = 1. - w0;
    vec2 q = s*res;
    vec3 c0, c1, c2, c3; float k0, k1, k2, k3, r0, r1, r2, r3;
    float tol = pincel > 2.5 ? .3 : .22;
    strokesA(q, F, G, cs, 0., ph0*flowP*ppu, here, tol, c0, k0, r0);
    strokesA(q, F, G, cs*.8, .5, ph0*flowP*ppu, here, tol, c1, k1, r1);
    strokesA(q, F, G, cs, .25, ph1*flowP*ppu, here, tol, c2, k2, r2);
    strokesA(q, F, G, cs*.8, .75, ph1*flowP*ppu, here, tol, c3, k3, r3);
    float ka = max(k0, k1), kb = max(k2, k3);
    vec3 ca = mix(c0, c1, step(k0, k1*.9)), cb = mix(c2, c3, step(k2, k3*.9));
    strokeK = ka*w0 + kb*w1;
    strokeCol = (ca*ka*w0 + cb*kb*w1)/max(strokeK, 1e-4);
    strokeRim = max(r0*k0, r1*k1)*w0 + max(r2*k2, r3*k3)*w1;
    if(dd.a < .5){ strokeK *= pincel > 2.5 ? .0 : 0.; }
  }
  return k;
}
// --------------------------------------------------------------------------------------------------------------
vec3 outside(vec2 w, float t, out float e, out float pen){
  vec2 wo = vec2(fbm(w*vec2(7.,5.)+t*1.7), fbm(w*vec2(6.,8.)-t*1.3)) - .5;
  vec2 s = w + wo*.006;
  if(pincel > 3.5){ e = 0.; pen = 0.; return texture2D(tDir, s).rgb*texture2D(tDir, s).a; }
  vec3 sCol; float sK = 0., sRim = 0.;
  vec4 k = pincel > .5 ? brushed(s, w, sCol, sK, sRim) : kuwahara(s);
  float a = smoothstep(.3,.7,k.a);
  vec3 obj = k.rgb/max(k.a,.001);
  if(pincel > 1.5){
    float glaze = pincel > 2.5 ? .85 : .7;
    obj = mix(obj, mix(obj, sCol, glaze), sK);
    obj *= 1. - (pincel > 2.5 ? .2 : .14)*sRim;
  }
  float lum = dot(obj, vec3(.299,.587,.114));
  obj = mix(vec3(lum), obj, .8); obj = mix(obj, vec3(1.), .1);
  vec2 px = 1./res;
  vec4 bl = (texture2D(tScene,s+vec2(4.,1.)*px)+texture2D(tScene,s-vec2(4.,1.)*px)+texture2D(tScene,s+vec2(-1.,4.)*px)+texture2D(tScene,s-vec2(-1.,4.)*px))*.25;
  e = smoothstep(.06,.35,length(k-bl)); pen = smoothstep(.55,1.,e)*.2;
  // under a grey sky the land loses colour too; fog is a haze that thickens towards the horizon and softens the
  // pen lines, which would otherwise show through it; its colour is the horizon's at that hour (grey by day, dark
  // blue at night)
  float ov = step(.5, wx);
  obj = mix(obj, mix(vec3(dot(obj, vec3(.299,.587,.114))), obj, .65)*.9, ov);
  vec3 c = mix(sky(w,t), obj, a);
  if(pincel > 1.5){
    vec4 dd; vec2 F = brushDir(s, w, dd);
    vec3 st = skyStrokes(s*res, F, (pincel > 2.5 ? 30. : 20.)*res.y/400.);
    float amp = pincel > 2.5 ? .8 : .5;
    amp *= max(step(.5, wx), smoothstep(.1, .16, length((w - sunPos)*vec2(waspect,1.))));   // not on the sun's (or the moon's) disc
    c *= mix(1., mix(1., .93 + .12*st.y, amp), st.x*(1. - a));
    c *= 1. - .08*amp*st.z*st.x*(1. - a);
  }
  if(wx > 2.5){ vec3 haze = mix(vec3(dot(skyHor, vec3(.3,.5,.2))), skyHor, .35); c = mix(c, haze, clamp(exp(-abs(w.y-hor)*3.2)*.85 + .25, 0., .92)); e *= .35; pen *= .35; }
  return c;
}

// the wash's front at this point of the wall: where it has climbed to (foldY, shade), roughened by 2D noise
float washFront(vec2 uv){
  float washTop = foldY + shade*(1.08 - foldY);
  return uv.y - washTop - (fbm(uv*vec2(9.,6.)*vec2(aspect,1.) + 4.7) - .5)*.11;
}
#ifdef WASH_PASS
// While the wall turns away only its wash changes. Rather than painting the whole wall again every frame, the wall is
// kept painted twice, dry and fully washed (washAll), and this pass lays the wash between them: in the pigment model
// below the paint is linear in how much the wash darkens the colour, so a part-wash is the mix of the two. Its rim
// darkens the paint the way the full pass's edge term does
uniform sampler2D tDry, tWet;
void main(){
  vec2 uv = vUv;
  float washD = washFront(uv);
  float wash = (1. - smoothstep(-.04, .04, washD)) * step(.001, shade);
  vec3 c = mix(texture2D(tDry, uv).rgb, texture2D(tWet, uv).rgb, wash*(.35 + .65*shade));
  vec3 paper = vec3(.94,.93,.90) * (.965 + .06*fbm(uv*sres*.09));
  c = paper - (paper - c)*(1. + ring(washD, .03)*wash*.32);
  gl_FragColor = vec4(max(c, 0.), 1.);
}
#else
void main(){
  vec2 uv = vUv, t2 = vec2(tq);
  float t = tq;
  vec2 wc = (win.xy+win.zw)*.5, wh = (win.zw-win.xy)*.5;
  vec2 wobble = (vec2(fbm(uv*vec2(16.,11.)+3.), fbm(uv*vec2(12.,17.)-5.))-.5)*.006;   // hand-painted edges
  float sdW = sdRR((uv+wobble-wc)*vec2(aspect,1.), wh*vec2(aspect,1.), wrad);
  vec3 col; float edge = 0., pen = 0., order;

  // on a phone our seat stands in front of the window's lower-left corner (overWin): there the carriage is painted
  bool ahead = overWin > .5 && texture2D(tRoom, uv).a > .95;
  if(sdW < 0. && !ahead){
    vec2 w = (uv - win.xy)/(win.zw - win.xy);
    float e;
    col = outside(w, t, e, pen);
    edge = e*.35;
    // the sash bar across the glass, and a faint reflection
    float bar = ring(w.y-.64, .012*(1.+.3*noise(uv*80.)));
    col = mix(col, wood*.9, bar*.9);
    col = mix(col, vec3(1.), .06*smoothstep(.2,.9,w.x-w.y+.5)*(1.-smoothstep(.0,.3,abs(w.x-w.y-.1))));
    // rain: drops on the glass, still (they sit on the window, not on the landscape going by), a darker rim each
    // and a trail under the bigger ones
    if(wx > 1.5 && wx < 2.5){
      vec2 g = vec2(w.x*waspect, w.y)*15.;
      vec2 id = floor(g), f = fract(g)-.5;
      float h = hash(id), r = .10 + .16*hash(id+7.3);
      vec2 o = (vec2(hash(id+1.1), hash(id+2.2))-.5)*.5;
      float d = length((f-o)*vec2(1.,.85));
      float drop = step(.55, h) * (1.-smoothstep(r-.03, r, d));
      float rim = step(.55, h) * ring(d-r+.02, .025);
      float trail = step(.86, h) * step(f.y, o.y) * (1.-smoothstep(.02,.05,abs(f.x-o.x))) * smoothstep(-.5, o.y, f.y);
      col = mix(col, col*1.12 + .05, drop*.7 + trail*.35);
      col = mix(col, col*.62, rim*.6);
      edge += rim*.3;
    }
    // PROTOTYPE idea 4: mist on the inside of the glass (rain or fog at home), wiped where a finger or the cursor passed
    if(vaho > .5){                                                  // any day (Àlex, 08-11); thicker with rain or fog
      float wp = texture2D(tWipe, w).r;
      vec2 m = vec2(w.x*waspect, w.y);
      float d = mix(wx > 1.5 ? .78 : .64, .92, aliento)*(.82 + .36*fbm(m*7. + 2.));
      if(vaho > 2.5){                                               // c: it condenses at the edges and the bottom
        float ed = min(min(w.x, 1.-w.x)*waspect, min(w.y, 1.-w.y));
        d *= clamp(1. - smoothstep(.02, .2 + .1*fbm(m*5.), ed) + (1. - smoothstep(0., .45, w.y))*.8, 0., 1.);
      }
      float speck = step(.8, noise(m*260.))*.25;                    // the beads of the mist
      vec3 mist = mix(vec3(dot(skyHor, vec3(.3,.5,.2))), skyHor, .4)*.92 + .1;
      float k = d*(1. - wp);
      col = mix(col, mist, k*(.88 + speck));
      float rim = ring(wp - .45, .18)*d;                            // the water the finger pushed to the wipe's edge
      col = mix(col, col*.8, rim*.35); edge = mix(edge, edge*.3, k); pen *= 1. - k;
    }
    order = .45 + (w.y > hor ? (1.-w.y)/(1.-hor)*.24 : .24 + (hor-w.y)/hor*.3) + (fbm(w*vec2(3.,4.)+3.1)-.5)*.25;
  } else {
    // the carriage wall: the carriage built in 3D (room.ts), painted with brush strokes (room.frag), the brush
    // wandering a little; only its own edges, so nothing under a seat shows through
    vec2 wob = (vec2(fbm(uv*vec2(14.,10.)+1.), fbm(uv*vec2(10.,15.)-2.))-.5)*.004;
    vec4 rp = texture2D(tRoomP, uv + wob);
    col = mix(vec3(dot(rp.rgb, vec3(.3,.55,.15))), rp.rgb, .9);
    col *= mix(.7, 1., smoothstep(0., .24, uv.y));                    // the foot of the wall in shadow: the ruler reads over it
    edge = rp.a*.7;
    pen = smoothstep(.5, 1., rp.a)*.3;
    if(luz > .5){
      // fewer ink lines: an edge darkens the paint a little, a line shows only where two colours are far apart
      float soft = luz > 1.5 ? .35 : .55;
      edge *= soft; pen *= luz > 1.5 ? .25 : .5;
      // the strongest light left as paper, the way a watercolourist leaves the white of the sheet
      float lum = dot(col, vec3(.3,.55,.15));
      if(luz > 1.5) col = mix(col, calido > 2.5 ? vec3(1.,.94,.82) : vec3(.98,.95,.88), smoothstep(.62, .9, lum)*.7);
    }
    if(calido > 2.5) col *= vec3(1.17, 1., .7);   // PROTOTYPE c: a warm glaze (raw sienna) over the whole carriage
    // the name's split-flap board (.tauler), painted on the wall like the window and the seats (Àlex, 10-10): a dark
    // panel with a soft shadow, and eight cells with their hinge. Its geometry in em, as hero.css lays it out:
    // 8.58 × 1.58 em overall, the cells 0.97 × 1.32 em every 1.05 em, starting 0.13 em in (padding + border)
    if(brd.z > brd.x){
      vec2 bc = (brd.xy+brd.zw)*.5, bh = (brd.zw-brd.xy)*.5, bhA = bh*vec2(aspect,1.);
      vec2 q = (uv+wobble*.5-bc)*vec2(aspect,1.);
      float sdB = sdRR(q, bhA, bhA.y*.1);
      float sdSh = sdRR(q-vec2(.004,-.009), bhA, bhA.y*.1);
      col *= 1. - .38*(1.-smoothstep(-.004, .018, sdSh))*step(0., sdB);   // its shadow on the wall
      float inB = 1.-smoothstep(0., .0025, sdB);
      vec2 l = (uv+wobble*.5-brd.xy)/(brd.zw-brd.xy);
      float xe = l.x*8.58 - .13, ye = (1.-l.y)*1.58 - .13;                // em, from the first cell's top-left
      float k = clamp(floor((xe+.04)/1.05), 0., 7.);
      float sdc = sdRR(vec2(xe - k*1.05 - .485, ye - .66), vec2(.485,.66), .07) + (fbm(uv*60.+k)-.5)*.03;
      float inC = (1.-smoothstep(0., .02, sdc))*inB;
      col = mix(col, wood*.32, inB);
      col = mix(col, wood*(ye < .66 ? .62 : .5), inC);                    // the top flap lighter than the bottom one
      col = mix(col, vec3(.08,.065,.055), ring(ye-.66, .025)*inC);        // the hinge
      edge += ring(sdB, .003)*.5 + ring(sdc, .03)*.35*inB;
    }
    order = (1.-uv.y)*.25 + (fbm(uv*vec2(3.,2.)+7.)-.5)*.3;
  }

  // the wall's shadow as it turns away from the light: a pigment wash that starts at the hinge (foldY)
  // and climbs the whole wall, window included, as the wall turns (shade); it deepens as it climbs.
  // Its front is one continuous line roughened by 2D noise, so it advances unevenly by zone, and
  // darker and grainier at its rim, like a real wash
  // (washAll: the whole wall fully washed, with no rim, the far end the WASH_PASS mixes towards)
  float washD = washFront(uv);
  float wash = (1. - smoothstep(-.04, .04, washD)) * step(.001, shade);
  col *= mix(vec3(1.), vec3(.42,.38,.35), washAll > .5 ? 1. : wash*(.35 + .65*shade));
  edge += ring(washD, .03)*wash*.8*(1. - washAll);

  // paint it: absorbance, uneven density, granulation, darker edges, paper
  float wet = clamp((reveal*1.3 - order)/.16, 0., 1.);
  float front = wet*(1.-wet)*4.;
  vec3 A = 1. - col;
  A *= .86 + .3*fbm(uv*vec2(3.5,2.5)*vec2(aspect,1.)+11.);
  A *= 1. + (noise(uv*sres*.4)-.5)*(sdW<0.&&!ahead?.35:.18)*smoothstep(.1,.6,dot(A,vec3(.333)));
  A *= 1. + edge*.4;
  A *= mix(.25, 1., wet) * (1. + front*.9) * step(.001, wet+front);
  vec3 paper = vec3(.94,.93,.90) * (.965 + .06*fbm(uv*sres*.09));
  vec3 c = paper * (1. - clamp(A,0.,1.));
  if(sdW >= 0. || ahead){ vec4 pp = texture2D(tPaper, uv); c = c*(pp.r + .5) + (pp.g - .5)*vec3(1., .97, .9); }   // PROTOTYPE idea 2: g, light the paper's relief catches          // the paper's tooth and the wall's broad washes (room.frag)
  c *= 1. - pen*wet*vec3(.62,.6,.55);
  if(posterOn > .5) c = mix(texture2D(tPoster, vUv).rgb, c, clamp((wet + front)*1.4, 0., 1.));   // PROTOTYPE idea 5
  gl_FragColor = vec4(c, 1.);
}
#endif
