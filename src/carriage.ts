// Where the carriage built in 3D (room.ts) puts its seats, its camera and its lamp: pure, `npm test`.
// Units: the wall is the plane z = 0 and fills the screen exactly, x in [0, aspect], y in [0, 1] from the bottom,
// z towards the viewer. The window is 75 cm high, so it gives the metre the seats are built in.

export type Win = { x: number; y: number; z: number; w: number };   // fractions of the screen, y up
export interface Seat {
  x: number;          // its backrest's back, on the wall
  y0: number;         // its foot
  scale: number;      // a metre of the seat, in wall units
  dir: 1 | -1;        // which way it faces: 1 to the right
  handle: boolean;    // the grab handle on its headrest: the seats in front of the window
}
export interface Plan {
  m: number;                                  // a metre, in wall units
  floorY: number;                             // the floor, under the wall
  cx: number;                                 // the window's centre
  seats: Seat[];
  eye: [x: number, y: number, d: number];     // the camera, in front of the wall's centre
  lamp: [x: number, y: number, z: number, reach: number] | null;   // a phone's strip light over our seat
  rack: number | null;                        // the luggage rack's height, or none where it would be cut by the top edge
  luggage: boolean;                           // the case and the backpack on it, only where they fit whole too
  bags: number;                               // the case's centre on the rack (the backpack .125 of the width right of it)
}

export const ARMREST = .68;   // the armrest's height in a seat's metres (room.ts builds it there)

// where a point of the carriage lands on the screen, its height and how far it stands off the wall (the eye below)
const seen = (y: number, z: number) => .5 + (y - .5)*1.7/(1.7 - z);
// the rack 1.72 m over the floor, 36 cm deep; the case on it 19 cm high to its handle, 31 cm out. Either whole under
// the screen's top edge or not at all: a phone held sideways has no wall over its window, and a cut rack reads as
// pieces left half drawn
function rack(floorY: number, m: number){
  const rf = floorY + 1.72*m;
  if(seen(rf, .36*m) >= .99) return { rack: null, luggage: false };
  return { rack: rf, luggage: seen(rf + .19*m, .31*m) < .99 };
}

// A wide screen: a bay of two seats facing each other either side of the window, each backed by the next bay's seat.
// A phone (Àlex, 07-11): our seat alone, close up and in profile at the window's lower-left corner, a fixed size on
// the screen, cut by the bottom edge below its armrest (its base would show how little there is under it), with the
// back of the next bay's seat behind it, partly off the left edge
export function plan(A: number, win: Win, wide: boolean): Plan {
  const m = (win.w - win.y)/.75, floorY = win.y - .9*m, cx = (win.x + win.z)/2*A;
  const eye: Plan['eye'] = [A/2, .5, 1.7];
  if(wide){
    const seats: Seat[] = [];
    for(const s of [-1, 1] as const){
      // close to the window and a hair low: where Àlex placed them on the canvas (08-11)
      seats.push({ x: cx + s*.81*m, y0: floorY - .008*m, scale: m, dir: (-s) as 1 | -1, handle: true });
      seats.push({ x: cx + s*.98*m, y0: floorY - .008*m, scale: m, dir: s, handle: false });
    }
    return { m, floorY, cx, seats, eye, lamp: null, ...rack(floorY, m), bags: .565*A };
  }
  // its backrest's back just left of the window's left edge and its armrest a fifth up the screen: where Àlex placed
  // it on the canvas (08-11; on a 390 × 844 phone, 40 px left and 43 px lower than before). Its cushion lands behind
  // the day's ruler: room.ts keeps it in shade so the ruler's hours read (Àlex, 08-11, check_ruler_foot)
  const scale = .6, x = win.x*A - .015, y0 = .204 - ARMREST*scale;
  const seats: Seat[] = [
    { x, y0, scale, dir: 1, handle: true },
    { x: x - .17*scale, y0, scale, dir: -1, handle: false },
  ];
  // the case 19 px further right than on a desktop (Àlex, 08-11)
  return { m, floorY, cx, seats, eye, lamp: [win.x*A + .002 - .07*m, floorY + 1.2*m, .7, 1.6*m], ...rack(floorY, m), bags: .565*A + .021 };
}
