// where the turn to the table settles when the scroll rests halfway through it (option 2, Àlex 20-10): on in the
// direction the gesture was going, as a turn once begun is meant to be finished, but a nudge at either end (less
// than NUDGE of the turn) is not a turn, and goes back. p: how far the gaze has dropped (dropped() in shelf.ts);
// dir: the last scroll's direction, 1 down, -1 up, 0 none yet. Returns 0 (the hero) or 1 (the table)
const NUDGE = .1;
export function settle(p: number, dir: number): 0 | 1 {
  if(dir > 0) return p > NUDGE ? 1 : 0;
  if(dir < 0) return p < 1 - NUDGE ? 0 : 1;
  return p < .5 ? 0 : 1;
}
