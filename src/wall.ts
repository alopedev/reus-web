// The carriage's wall as a flat shape with the window's opening, and the rings of the window's lining (room.ts).
// Units of carriage.ts: the screen is [0, A] × [0, 1]
import { Shape, type Path } from 'three';
import type { Win } from './carriage';

export function rrect(s: Shape | Path, x0: number, y0: number, x1: number, y1: number, r: number){
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1); s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
}
// the wall: a little more than the screen, the window cut out. A plain rectangle: drawn as a rounded one with no
// radius, its doubled corners made the triangulation drop part of the wall round a window near the edges
export function wallShape(A: number, win: Win, r: number){
  const s = new Shape(); s.moveTo(-.15, -.15); s.lineTo(A + .15, -.15); s.lineTo(A + .15, 1.15); s.lineTo(-.15, 1.15); s.lineTo(-.15, -.15);
  const h = new Shape(); rrect(h, win.x*A, win.y, win.z*A, win.w, r); s.holes.push(h);
  return s;
}
// a band round the window, from inner to outer beyond its edge
export function ring(win: Win, A: number, r: number, inner: number, outer: number){
  const s = new Shape(); rrect(s, win.x*A - outer, win.y - outer, win.z*A + outer, win.w + outer, r + outer);
  const h = new Shape(); rrect(h, win.x*A - inner, win.y - inner, win.z*A + inner, win.w + inner, r + inner);
  s.holes.push(h); return s;
}
