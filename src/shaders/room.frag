// The carriage built in 3D (room.ts), painted. Two passes, each once per screen, window or light, never per frame:
// the brush strokes over the rendered carriage (Àlex, 07-11, option B of three: a wash that follows each surface,
// then strokes along it with a darker rim where they dry), and the paper's tooth with the wall's broad washes
// (PAPER_PASS). The watercolour pass (watercolor.frag) lays both like the rest of the wall.
precision highp float;
uniform sampler2D tRoom, tRoomN; uniform vec2 sres; uniform float aspect; uniform vec4 win; uniform vec3 sunS;
varying vec2 vUv;
// the same noise as watercolor.frag's
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
float ring(float sd, float w){ return 1. - smoothstep(0., w, abs(sd)); }

#ifdef PAPER_PASS
// the tooth of a watercolour paper, about 50 bumps to a screen high, in four rotated octaves (value noise in one
// grid shows its squares when lit)
float tooth(vec2 q){
  mat2 r1 = mat2(.8, .6, -.6, .8), r2 = mat2(.38, -.92, .92, .38);
  return .5 + 2.*(.4*noise(q*55.) + .3*noise(r1*q*110. + 7.) + .15*noise(r2*q*220. + 1.) + .15*noise(r2*q*14. + 3.) - .5);   // spread like a scanned sheet's
}
void main(){
  vec2 uv = vUv, P = uv*vec2(aspect, 1.), q = P*1.7;
  float e = 1.5/1024., h = tooth(q);
  float hx = tooth(q + vec2(e, 0.)) - tooth(q - vec2(e, 0.)), hy = tooth(q + vec2(0., e)) - tooth(q - vec2(0., e));
  float k = 1. - (.5 - h)*.26;                                      // pigment settles in the tooth's pits
  // broad washes across the wall, as if laid in six strokes from the top, darker where two overlap, with back-runs
  float yy = uv.y + (fbm(vec2(uv.x*2.5, uv.y*3.) + 2.) - .5)*.05;
  float band = floor(yy*6.), fb = fract(yy*6.);
  float dens = .1*(hash(vec2(band, 3.1)) - .5) + (fbm(vec2(uv.x*1.8 + band, band)) - .5)*.16;
  dens += .1*(1. - smoothstep(0., .06, fb));
  float bl = fbm(P*2.2 + 9.);
  dens += -.08*smoothstep(.56, .6, bl) + .14*ring(bl - .58, .012);
  dens += .1*(fbm(q*4. + 5.) - .5);                                 // the paper's own mottling
  k *= 1. - dens;
  // the tooth lit: the light comes the way the sun is, from where it is painted in the window (sunS.xy), parallel across the whole
  // wall; stronger the lower the sun (sunS.z), faint by moonlight (Àlex 08-11, idea 2 A). r: the factor the paint is
  // multiplied by, less .5; g: the light the bumps' sunny faces catch even where the paint is dark, plus .5
  vec2 wc = (win.xy + win.zw)*.5;
  vec2 sp = vec2(mix(win.x, win.z, sunS.x), mix(win.y, win.w, sunS.y));
  vec2 Ls = normalize((sp - wc)*vec2(aspect, 1.) + vec2(.0001));
  float lit = clamp(-(hx*Ls.x + hy*Ls.y)*3., -1., 1.);
  gl_FragColor = vec4(k*(1. + lit*.45*sunS.z) - .5, .5 + lit*.09*sunS.z, 0., 1.);
}
#else
// which way the brush runs at each point: along the edges of the carriage's colours (their structure tensor) where
// there are edges; elsewhere along each surface as it turns away from us (its facing, tRoomN), and in a nearly level,
// wandering wash on what faces us
float lum(vec2 p){ return dot(texture2D(tRoom, p).rgb, vec3(.3,.55,.15)); }
vec2 flow(vec2 p){
  vec2 px = 2./sres; vec3 T = vec3(0.);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 q = p + vec2(float(i),float(j))*px*2.;
    float gx = lum(q+vec2(px.x,0.)) - lum(q-vec2(px.x,0.));
    float gy = lum(q+vec2(0.,px.y)) - lum(q-vec2(0.,px.y));
    T += vec3(gx*gx, gy*gy, gx*gy);
  }
  float d = sqrt(max((T.x-T.y)*(T.x-T.y) + 4.*T.z*T.z, 0.));
  float l1 = .5*(T.x+T.y+d), l2 = .5*(T.x+T.y-d);
  vec2 edgeDir = normalize(vec2(l1 - T.x, -T.z) + vec2(1e-6, 0.));
  edgeDir = abs(T.z) < 1e-7 ? (T.x > T.y ? vec2(0.,1.) : vec2(1.,0.)) : edgeDir;
  float coh = (l1 - l2)/(l1 + l2 + 1e-5) * smoothstep(.0004, .004, l1);
  vec3 n = texture2D(tRoomN, p).rgb*2. - 1.;
  float tilt = length(n.xy);
  float a0 = .12 + (fbm(p*vec2(3.,2.)*vec2(aspect,1.) + 3.) - .5)*.7;
  vec2 face = vec2(cos(a0), sin(a0));
  vec2 turn = tilt > .05 ? normalize(vec2(-n.y, n.x)) : face;
  vec2 base = normalize(mix(face, turn*sign(dot(turn, face) + 1e-4), smoothstep(.15, .5, tilt)));
  return normalize(mix(base, edgeDir*sign(dot(edgeDir, base) + 1e-4), coh));
}
// the four-quadrant filter stretched along the brush (an anisotropic Kuwahara)
vec4 quadrant(vec2 p, vec2 qx, vec2 qy, out float var){
  vec4 m = vec4(0.); vec3 s = vec3(0.);
  for(int j=0;j<3;j++) for(int i=0;i<3;i++){ vec4 c = texture2D(tRoom, p + float(i)*qx + float(j)*qy); m += c; s += c.rgb*c.rgb; }
  m /= 9.; s /= 9.; s = abs(s - m.rgb*m.rgb); var = s.r+s.g+s.b; return m;
}
// one layer of strokes: cells along the brush, a stroke per cell, long along it and narrow across, its colour picked
// where it starts (and only over its own surface); out: its body (cover) and its rim
void strokes(vec2 q, vec2 F, vec2 G, float cs, float off, vec3 here, out vec3 col, out float cover, out float rim){
  col = here; cover = 0.; rim = 0.;
  vec2 cq = vec2(dot(q, F), dot(q, G))/cs + off;
  vec2 cell = floor(cq);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 c = cell + vec2(float(i), float(j));
    float r1 = hash(c + off*7.1), r2 = hash(c.yx + 3.3 + off), r3 = hash(c + 9.7);
    vec2 cen = c + .5 + (vec2(r1, r2) - .5)*vec2(.6, .5);
    float rr = length((cq - cen)/vec2(1.05 + .4*r3, .36 + .12*r1));
    float k = 1. - smoothstep(.55, 1., rr);
    if(k <= 0.) continue;
    vec2 cuv = (cen.x - off)*cs*F + (cen.y - off)*cs*G;
    vec3 sc = texture2D(tRoom, cuv/sres).rgb;
    if(length(sc - here) > .16) continue;
    if(k > cover){ col = sc*(.86 + .24*r2); cover = k; rim = ring(rr - .85, .2); }   // how loaded the brush was
  }
}
void main(){
  vec2 p = vUv, px = 1./sres;
  vec2 F = flow(p), G = vec2(-F.y, F.x);
  float v0,v1,v2,v3;
  vec2 ax = F*px*4.6, ay = G*px;
  vec4 a=quadrant(p,-ax,-ay,v0), b=quadrant(p,ax,-ay,v1), c=quadrant(p,ax,ay,v2), d=quadrant(p,-ax,ay,v3);
  vec4 r=a; float mv=v0; if(v1<mv){mv=v1;r=b;} if(v2<mv){mv=v2;r=c;} if(v3<mv){mv=v3;r=d;}
  vec3 col = r.rgb;
  vec2 bpx = 3.*px;
  vec3 bl = (texture2D(tRoom,p+vec2(bpx.x,0.)).rgb+texture2D(tRoom,p-vec2(bpx.x,0.)).rgb+texture2D(tRoom,p+vec2(0.,bpx.y)).rgb+texture2D(tRoom,p-vec2(0.,bpx.y)).rgb)*.25;
  float e = smoothstep(.04,.22,length(r.rgb-bl));
  // two layers of strokes, the second smaller and offset, glazed over the filtered colour, the pigment pooling at
  // each stroke's rim; a stroke is about 30 px on a 900-px-high screen
  float cs = 30.*sres.y/900.;
  vec2 q = p*sres;
  vec3 c1, c2; float k1, k2, r1, r2;
  strokes(q, F, G, cs, 0., col, c1, k1, r1);
  strokes(q, F, G, cs*.8, .5, col, c2, k2, r2);
  float k = max(k1, k2), rim = max(r1*k1, r2*k2);
  col = mix(col, mix(col, mix(c1, c2, step(k1, k2*.9)), .7), k);
  col *= 1. - .14*rim;
  gl_FragColor = vec4(col, max(e, .25*rim));
}
#endif
