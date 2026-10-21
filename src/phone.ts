// what a phone is: narrow, or a portrait tablet (UPRIGHT), or a phone held sideways, too low for the wide hero
// (SIDEWAYS, Àlex 12-10). The hero stacks, the board keeps only its times and the landscape is painted twice as fine
// (Àlex 21-10: before, held sideways it kept a desktop's grain). hero.css and chooser.css copy these: phone.test.ts
export const UPRIGHT = '(max-width:700px), (max-aspect-ratio:4/5)';
export const SIDEWAYS = '(orientation:landscape) and (max-height:500px)';
export const PHONE = `${UPRIGHT}, ${SIDEWAYS}`;
