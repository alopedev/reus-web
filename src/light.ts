import { madridNow } from './time';

export type Rgb = [number, number, number];
export type Hour = 'night' | 'dawn' | 'day' | 'dusk';
export interface Daylight {
  name: Hour; top: Rgb; hor: Rgb; sun: Rgb; sunUV: [number, number]; glow: number;   // glow: how much the sun (or moon) shows
  hemi: [sky: number, ground: number, intensity: number]; dir: [color: number, intensity: number, position: Rgb];
  wallA: Rgb; wallB: Rgb; wood: Rgb; seat: Rgb;
}

// the five lights the day goes through; the blue hour (08-10, Àlex: C) is the light after sunset, before night
const NIGHT: Daylight = {name:'night', top:[.20,.24,.40], hor:[.42,.46,.62], sun:[.95,.94,.86], sunUV:[.82,.84], glow:.85, hemi:[0x7080b0,0x202433,.55], dir:[0xaab8e0,.35,[-.3,.8,.4]],
  wallA:[.27,.27,.35], wallB:[.17,.17,.24], wood:[.15,.13,.16], seat:[.09,.09,.12]};
const DAWN: Daylight = {name:'dawn', top:[.78,.64,.56], hor:[.95,.83,.66], sun:[.95,.62,.36], sunUV:[.8,.5], glow:.85, hemi:[0xf2d9c2,0x6b5a45,.8], dir:[0xffc690,.9,[.6,.35,.5]],
  wallA:[.66,.53,.45], wallB:[.46,.35,.30], wood:[.36,.25,.20], seat:[.21,.19,.21]};
const DAY: Daylight = {name:'day', top:[.52,.66,.78], hor:[.88,.91,.90], sun:[.97,.82,.46], sunUV:[.82,.82], glow:.85, hemi:[0xe3ecf2,0x7d6e4d,.85], dir:[0xfff3de,.85,[.4,.9,.5]],
  wallA:[.60,.52,.42], wallB:[.42,.35,.27], wood:[.34,.25,.18], seat:[.19,.20,.21]};
const DUSK: Daylight = {name:'dusk', top:[.60,.44,.60], hor:[.96,.72,.56], sun:[.96,.55,.32], sunUV:[.8,.46], glow:.85, hemi:[0xf0c7c7,0x5a4a52,.75], dir:[0xff9f7a,.8,[-.6,.3,.5]],
  wallA:[.58,.44,.41], wallB:[.39,.29,.28], wood:[.31,.21,.19], seat:[.19,.16,.19]};
const BLUE: Daylight = {name:'night', top:[.17,.24,.46], hor:[.46,.52,.72], sun:[.80,.80,.95], sunUV:[.8,.40], glow:0, hemi:[0x6a7fc0,0x2a2c40,.62], dir:[0x9fb4ee,.45,[-.5,.4,.5]],
  wallA:[.36,.35,.45], wallB:[.23,.23,.32], wood:[.20,.17,.21], seat:[.12,.12,.16]};

// sunrise and sunset in Barcelona (41.38° N, 2.17° E), in Madrid minutes: NOAA's «General Solar Position
// Calculations» (gml.noaa.gov/grad/solcalc/solareqns.PDF), within a minute or two of the published tables. The
// towns are at most ~7 minutes away from Barcelona's sun
export function sunTimes(iso: string): [rise: number, set: number] {
  const noon = new Date(iso+'T12:00:00Z'), y = noon.getUTCFullYear();
  const g = 2*Math.PI/(y % 4 ? 365 : 366) * Math.round((noon.getTime() - Date.UTC(y, 0, 1, 12))/864e5);
  const eq = 229.18*(.000075 + .001868*Math.cos(g) - .032077*Math.sin(g) - .014615*Math.cos(2*g) - .040849*Math.sin(2*g));
  const dec = .006918 - .399912*Math.cos(g) + .070257*Math.sin(g) - .006758*Math.cos(2*g) + .000907*Math.sin(2*g) - .002697*Math.cos(3*g) + .00148*Math.sin(3*g);
  const lat = 41.38*Math.PI/180, lon = 2.17, rad = Math.PI/180;
  const ha = Math.acos(Math.cos(90.833*rad)/(Math.cos(lat)*Math.cos(dec)) - Math.tan(lat)*Math.tan(dec))/rad;
  // Madrid's offset from UTC that day (summer time or not), read off the calendar rather than worked out
  const h = +new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Madrid', hour:'2-digit', hourCycle:'h23'}).format(noon);
  const tz = (h - 12)*60;
  return [720 - 4*(lon + ha) - eq + tz, 720 - 4*(lon - ha) - eq + tz];
}

// each light is reached at its mark on the sun's clock and blends into the next over the BLEND minutes before
// that one's mark: night until just before sunrise, dawn, day, dusk until just after sunset, the blue hour, night
const BLEND = 40;
function marks(iso: string): [min: number, light: Daylight][] {
  const [rise, set] = sunTimes(iso);
  return [[rise-30, NIGHT], [rise+15, DAWN], [rise+120, DAY], [set-90, DUSK], [set+20, BLUE], [set+75, NIGHT]];
}

const L = (a: number, b: number, t: number) => a + (b-a)*t;
const LR = (a: Rgb, b: Rgb, t: number): Rgb => [L(a[0],b[0],t), L(a[1],b[1],t), L(a[2],b[2],t)];
const rgb = (c: number): Rgb => [(c>>16&255)/255, (c>>8&255)/255, (c&255)/255];
const hex = (r: Rgb) => (Math.round(r[0]*255)<<16) | (Math.round(r[1]*255)<<8) | Math.round(r[2]*255);
function mix(a: Daylight, b: Daylight, t: number): Daylight {
  // the sun never turns into the moon on its way across the sky: between night and the rest, one fades out where it
  // is and the other fades in where it will be; otherwise it moves and its glow follows
  let sunUV: [number, number], glow: number;
  if((a.name === 'night') !== (b.name === 'night') && a.glow && b.glow){ sunUV = t < .5 ? a.sunUV : b.sunUV; glow = t < .5 ? a.glow*(1-2*t) : b.glow*(2*t-1); }
  else { sunUV = !a.glow ? b.sunUV : !b.glow ? a.sunUV : [L(a.sunUV[0],b.sunUV[0],t), L(a.sunUV[1],b.sunUV[1],t)]; glow = L(a.glow, b.glow, t); }
  return {name: t < .5 ? a.name : b.name, top: LR(a.top,b.top,t), hor: LR(a.hor,b.hor,t), sun: LR(a.sun,b.sun,t), sunUV, glow,
    hemi: [hex(LR(rgb(a.hemi[0]),rgb(b.hemi[0]),t)), hex(LR(rgb(a.hemi[1]),rgb(b.hemi[1]),t)), L(a.hemi[2],b.hemi[2],t)],
    dir: [hex(LR(rgb(a.dir[0]),rgb(b.dir[0]),t)), L(a.dir[1],b.dir[1],t), LR(a.dir[2],b.dir[2],t)],
    wallA: LR(a.wallA,b.wallA,t), wallB: LR(a.wallB,b.wallB,t), wood: LR(a.wood,b.wood,t), seat: LR(a.seat,b.seat,t)};
}

/* one light drives the landscape and the carriage it shines into: the light of that minute on that day (today in
   Madrid by default), following the real sun */
export function daylight(min: number, iso: string = madridNow().date): Daylight {
  const m = marks(iso);
  if(min < m[0][0]) return m[0][1];
  for(let i = 1; i < m.length; i++){
    if(min >= m[i][0]) continue;
    const t = (min - (m[i][0] - BLEND)) / BLEND;
    return t > 0 ? mix(m[i-1][1], m[i][1], t) : m[i-1][1];
  }
  return m[m.length-1][1];
}
