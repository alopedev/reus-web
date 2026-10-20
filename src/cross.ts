// the two ends of the ticket cross over when the arrows turn the trip around (option B «De papel», Àlex 20-10): each
// slides from where it was to its new place on a low arc, the one going right over and the one going left under, so the
// two names never run through each other. Pure: the keyframes from the end's two places on the page
const LIFT = 9;

export function crossing(from: {x: number, y: number}, to: {x: number, y: number}): Keyframe[] {
  const dx = from.x - to.x, dy = from.y - to.y, lift = to.x > from.x ? -LIFT : LIFT;
  return [{transform: `translate(${dx}px,${dy}px)`}, {transform: `translate(${dx / 2}px,${dy / 2 + lift}px)`, offset: .5}, {transform: 'none'}];
}
