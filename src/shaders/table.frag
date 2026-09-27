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
}
