precision highp float;
uniform sampler2D tScene; uniform vec2 res, sres; uniform float tq, reveal, aspect, waspect, hor, wrad, seats, foldY, shade;
uniform vec3 skyTop, skyHor, sunCol, wallA, wallB, wood, seat; uniform vec2 sunPos; uniform float sunA; uniform vec4 win; uniform float wx;
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
  // under a grey sky the land loses colour too; fog is a haze that thickens towards the horizon and softens the
  // pen lines, which would otherwise show through it; its colour is the horizon's at that hour (grey by day, dark
  // blue at night)
  float ov = step(.5, wx);
  obj = mix(obj, mix(vec3(dot(obj, vec3(.299,.587,.114))), obj, .65)*.9, ov);
  vec3 c = mix(sky(w,t), obj, a);
  if(wx > 2.5){ vec3 haze = mix(vec3(dot(skyHor, vec3(.3,.5,.2))), skyHor, .35); c = mix(c, haze, clamp(exp(-abs(w.y-hor)*3.2)*.85 + .25, 0., .92)); e *= .35; pen *= .35; }
  return c;
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
}
